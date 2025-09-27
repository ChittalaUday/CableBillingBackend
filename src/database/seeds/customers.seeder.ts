import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { Logger } from '@/utils/logger.util';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

interface CustomerCSVData {
  sno: string;
  accountNo: string;
  lcoCustomerId: string;
  serialNumber: string;
  vcNumber: string;
  name: string;
  address: string;
  createdDate: string;
  mobileNo: string;
  package: string;
  status: string;
  msoShareDue: string;
}

export class CustomersSeeder {
  private readonly DEFAULT_PASSWORD = 'customer123';
  private readonly CSV_FILE_PATH = path.join(__dirname, '..', '..', '..', 'src', 'database', 'seeds', 'customer_data.csv');

  /**
   * Parse CSV data and create customers
   */
  public async seed(): Promise<void> {
    try {
      Logger.info('Starting customer seeding...');

      // Read and parse CSV file
      const csvData = await this.parseCSVFile();
      
      // Get admin user as creator
      const adminUser = await this.getAdminUser();

      Logger.info(`Found ${csvData.length} customers in CSV file`);

      // Hash default password once
      const hashedPassword = await bcrypt.hash(this.DEFAULT_PASSWORD, 10);

      let successCount = 0;
      let errorCount = 0;

      for (const customerData of csvData) {
        try {
          await this.createOrUpdateCustomer(customerData, hashedPassword, adminUser.id);
          successCount++;
          
          if (successCount % 10 === 0) {
            Logger.info(`Processed ${successCount} customers...`);
          }
        } catch (error: any) {
          errorCount++;
          Logger.warn(`Failed to process customer ${customerData.accountNo}: ${error.message}`);
        }
      }

      Logger.info(`Customer seeding completed. Success: ${successCount}, Errors: ${errorCount}`);
      
      if (successCount > 0) {
        Logger.info(`Default password for all customers: ${this.DEFAULT_PASSWORD}`);
      }

    } catch (error) {
      Logger.error('Customer seeding failed:', error);
      throw error;
    }
  }

  /**
   * Clear all customers
   */
  public async clear(): Promise<void> {
    try {
      Logger.info('Clearing customers...');

      // Delete related records first to handle foreign key constraints
      await prisma.$transaction(async (tx) => {
        await tx.transaction.deleteMany();
        await tx.payment.deleteMany();
        await tx.dueSettlement.deleteMany();
        await tx.complaint.deleteMany();
        await tx.bill.deleteMany();
        await tx.customer.deleteMany();
      });

      Logger.info('All customers cleared successfully');
    } catch (error) {
      Logger.error('Failed to clear customers:', error);
      throw error;
    }
  }

  /**
   * Parse CSV file and return customer data
   */
  private async parseCSVFile(): Promise<CustomerCSVData[]> {
    const csvContent = fs.readFileSync(this.CSV_FILE_PATH, 'utf-8');
    const lines = csvContent.split('\n').filter(line => line.trim());
    
    // Skip header line
    const dataLines = lines.slice(1);
    
    const customers: CustomerCSVData[] = [];

    for (const line of dataLines) {
      // Handle CSV parsing with quoted fields that may contain commas
      const fields = this.parseCSVLine(line);
      
      if (fields.length >= 12) {
        customers.push({
          sno: fields[0]?.trim() || '',
          accountNo: fields[1]?.trim() || '',
          lcoCustomerId: fields[2]?.trim() || '',
          serialNumber: fields[3]?.trim() || '',
          vcNumber: fields[4]?.trim() || '',
          name: fields[5]?.trim() || '',
          address: fields[6]?.trim() || '',
          createdDate: fields[7]?.trim() || '',
          mobileNo: fields[8]?.trim() || '',
          package: fields[9]?.trim() || '',
          status: fields[10]?.trim() || '',
          msoShareDue: fields[11]?.trim() || '0'
        });
      }
    }

    return customers;
  }

  /**
   * Parse a single CSV line handling quoted fields with commas
   */
  private parseCSVLine(line: string): string[] {
    const fields: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        fields.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    
    fields.push(current);
    return fields;
  }

  /**
   * Create a single customer from CSV data
   */
  private async createCustomer(
    data: CustomerCSVData, 
    hashedPassword: string, 
    createdBy: string
  ): Promise<void> {
    // Skip empty or invalid records
    if (!data.accountNo || !data.name || !data.mobileNo) {
      throw new Error('Missing required fields: accountNo, name, or mobileNo');
    }

    // Parse name into first and last name
    const nameParts = data.name.split(' ');
    const firstName = nameParts[0] || 'Unknown';
    const lastName = nameParts.slice(1).join(' ') || 'Customer';

    // Clean and validate mobile number
    const cleanMobile = data.mobileNo.replace(/[^\d]/g, '');
    if (cleanMobile.length < 10) {
      throw new Error(`Invalid mobile number: ${data.mobileNo}`);
    }

    // Parse installation date
    let installationDate: Date;
    try {
      if (data.createdDate && data.createdDate.trim()) {
        // Handle various date formats
        const dateStr = data.createdDate.trim();
        
        // Try parsing DD/MM/YYYY or DD-MM-YYYY format
        const dateParts = dateStr.split(/[\/-]/);
        if (dateParts.length === 3) {
          const day = parseInt(dateParts[0] || '1');
          const month = parseInt(dateParts[1] || '1');
          let year = parseInt(dateParts[2] || '2024');
          
          // If year is 2-digit, add 2000
          if (year < 100) {
            year = 2000 + year;
          }
          
          // Validate date parts
          if (day >= 1 && day <= 31 && month >= 1 && month <= 12 && year >= 1900 && year <= 2030) {
            installationDate = new Date(year, month - 1, day);
            
            // Check if the date is valid
            if (isNaN(installationDate.getTime())) {
              installationDate = new Date(); // Default to current date
            }
          } else {
            installationDate = new Date(); // Default to current date
          }
        } else {
          // Try direct date parsing
          installationDate = new Date(dateStr);
          if (isNaN(installationDate.getTime())) {
            installationDate = new Date(); // Default to current date
          }
        }
      } else {
        installationDate = new Date(); // Default to current date
      }
    } catch {
      installationDate = new Date(); // Default to current date
    }

    // Determine customer status
    const status = data.status.toLowerCase() === 'active' ? 'ACTIVE' : 
                  data.status.toLowerCase() === 'deactive' ? 'SUSPENDED' : 'PENDING';

    // Parse MSO Share Due
    const msoShareDue = parseFloat(data.msoShareDue) || 0;

    // Generate customer number if not provided
    const customerNumber = data.accountNo || await this.generateCustomerNumber();

    // Default values for missing required fields
    const connectionType = 'CABLE_TV'; // Default connection type
    const packageType = 'BASIC'; // Default package type
    const monthlyRate = 100; // Default monthly rate

    // Extract city and state from address (basic parsing)
    const addressParts = data.address.split(',').map(part => part.trim());
    let city = 'Unknown';
    let state = 'Unknown';
    let address = data.address;

    if (addressParts.length >= 2) {
      city = addressParts[addressParts.length - 1] || 'Unknown';
      state = 'Andhra Pradesh'; // Default state based on data
      address = addressParts.slice(0, -1).join(', ');
    }

    try {
      await prisma.customer.create({
        data: {
          accountNo: data.accountNo,
          customerNumber,
          lcoCustomerId: data.lcoCustomerId || null,
          serialNumber: data.serialNumber || null,
          vcNumber: data.vcNumber || null,
          firstName,
          lastName,
          email: null, // Not provided in CSV
          password: hashedPassword,
          phone: cleanMobile,
          address,
          city,
          state,
          zipCode: '000000', // Default zip code
          connectionType,
          packageType,
          monthlyRate,
          installationDate,
          status,
          msoShareDue,
          notes: data.package ? `Packages: ${data.package}` : null,
          createdBy,
        },
      });
    } catch (error: any) {
      if (error.code === 'P2002') {
        // Handle unique constraint violations
        if (error.meta?.target?.includes('accountNo')) {
          throw new Error(`Account number ${data.accountNo} already exists`);
        }
        if (error.meta?.target?.includes('customerNumber')) {
          throw new Error(`Customer number ${customerNumber} already exists`);
        }
        if (error.meta?.target?.includes('phone')) {
          throw new Error(`Phone number ${cleanMobile} already exists`);
        }
      }
      throw error;
    }
  }

  /**
   * Get admin user for created by field
   */
  private async getAdminUser(): Promise<{ id: string }> {
    let adminUser = await prisma.user.findFirst({
      where: { role: 'ADMIN' },
      select: { id: true },
    });

    if (!adminUser) {
      // Create a default admin user if none exists
      Logger.info('No admin user found, creating default admin user...');
      
      const hashedPassword = await bcrypt.hash('admin123', 10);
      
      adminUser = await prisma.user.create({
        data: {
          email: 'admin@cablemanagement.com',
          username: 'admin',
          password: hashedPassword,
          firstName: 'System',
          lastName: 'Administrator',
          role: 'ADMIN',
          isActive: true,
          isVerified: true,
        },
        select: { id: true },
      });

      Logger.info('Default admin user created with email: admin@cablemanagement.com and password: admin123');
    }

    return adminUser;
  }

  /**
   * Create or update a single customer from CSV data
   */
  private async createOrUpdateCustomer(
    data: CustomerCSVData, 
    hashedPassword: string, 
    createdBy: string
  ): Promise<void> {
    // Skip empty or invalid records
    if (!data.accountNo || !data.name || !data.mobileNo) {
      throw new Error('Missing required fields: accountNo, name, or mobileNo');
    }

    // Parse name into first and last name
    const nameParts = data.name.split(' ');
    const firstName = nameParts[0] || 'Unknown';
    const lastName = nameParts.slice(1).join(' ') || 'Customer';

    // Clean and validate mobile number
    const cleanMobile = data.mobileNo.replace(/[^\d]/g, '');
    if (cleanMobile.length < 10) {
      throw new Error(`Invalid mobile number: ${data.mobileNo}`);
    }

    // Check if this phone number already exists in database during seeding
    // If it's a duplicate, generate a unique temporary phone number
    let finalPhoneNumber = cleanMobile;
    const existingPhoneRecord = await prisma.customer.findFirst({
      where: { phone: cleanMobile },
      select: { id: true }
    });
    
    if (existingPhoneRecord) {
      // Generate a unique temporary phone number for duplicates during seeding
      // Format: 9999XXXXXXX where X is random digits
      const timestamp = Date.now().toString().slice(-6); // Last 6 digits of timestamp
      const randomDigits = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      finalPhoneNumber = `9999${timestamp}${randomDigits}`;
      
      Logger.warn(`Duplicate phone number ${cleanMobile} found for customer ${data.accountNo}, assigning temporary phone: ${finalPhoneNumber}`);
    }

    // Parse installation date
    let installationDate: Date;
    try {
      if (data.createdDate && data.createdDate.trim()) {
        // Handle various date formats
        const dateStr = data.createdDate.trim();
        
        // Try parsing DD/MM/YYYY or DD-MM-YYYY format
        const dateParts = dateStr.split(/[\/\-]/);
        if (dateParts.length === 3) {
          const day = parseInt(dateParts[0] || '1');
          const month = parseInt(dateParts[1] || '1');
          let year = parseInt(dateParts[2] || '2024');
          
          // If year is 2-digit, add 2000
          if (year < 100) {
            year = 2000 + year;
          }
          
          // Validate date parts
          if (day >= 1 && day <= 31 && month >= 1 && month <= 12 && year >= 1900 && year <= 2030) {
            installationDate = new Date(year, month - 1, day);
            
            // Check if the date is valid
            if (isNaN(installationDate.getTime())) {
              installationDate = new Date(); // Default to current date
            }
          } else {
            installationDate = new Date(); // Default to current date
          }
        } else {
          // Try direct date parsing
          installationDate = new Date(dateStr);
          if (isNaN(installationDate.getTime())) {
            installationDate = new Date(); // Default to current date
          }
        }
      } else {
        installationDate = new Date(); // Default to current date
      }
    } catch {
      installationDate = new Date(); // Default to current date
    }

    // Determine customer status
    const status = data.status.toLowerCase() === 'active' ? 'ACTIVE' : 
                  data.status.toLowerCase() === 'deactive' ? 'SUSPENDED' : 'PENDING';

    // Parse MSO Share Due
    const msoShareDue = parseFloat(data.msoShareDue) || 0;

    // Default values for missing required fields
    const connectionType = 'CABLE_TV'; // Default connection type
    const packageType = 'BASIC'; // Default package type
    const monthlyRate = 100; // Default monthly rate

    // Extract city and state from address (basic parsing)
    const addressParts = data.address.split(',').map(part => part.trim());
    let city = 'Unknown';
    let state = 'Unknown';
    let address = data.address;

    if (addressParts.length >= 2) {
      city = addressParts[addressParts.length - 1] || 'Unknown';
      state = 'Andhra Pradesh'; // Default state based on data
      address = addressParts.slice(0, -1).join(', ');
    }

    // Check if customer already exists by accountNo or customerNumber (not by phone since we handle duplicates above)
    const existingCustomer = await prisma.customer.findFirst({
      where: {
        OR: [
          { accountNo: data.accountNo },
          { customerNumber: data.accountNo }
        ]
      }
    });

    const customerData = {
      accountNo: data.accountNo,
      customerNumber: data.accountNo,
      lcoCustomerId: data.lcoCustomerId || null,
      serialNumber: data.serialNumber || null,
      vcNumber: data.vcNumber || null,
      firstName,
      lastName,
      email: null as string | null, // Not provided in CSV
      phone: finalPhoneNumber,
      address,
      city,
      state,
      zipCode: '000000', // Default zip code
      connectionType: connectionType as 'CABLE_TV',
      packageType: packageType as 'BASIC',
      monthlyRate,
      installationDate,
      status: status as 'ACTIVE' | 'SUSPENDED' | 'PENDING',
      msoShareDue,
      notes: data.package ? `Packages: ${data.package}` : null,
    };

    if (existingCustomer) {
      // Update existing customer with new data
      await prisma.customer.update({
        where: { id: existingCustomer.id },
        data: {
          ...customerData,
          // Only update password if customer doesn't have one
          password: existingCustomer.password || hashedPassword,
          updater: {
            connect: { id: createdBy }
          },
        },
      });
      Logger.info(`Updated existing customer: ${data.accountNo}`);
    } else {
      // Create new customer
      await prisma.customer.create({
        data: {
          ...customerData,
          password: hashedPassword,
          creator: {
            connect: { id: createdBy }
          },
        },
      });
      Logger.info(`Created new customer: ${data.accountNo}`);
    }
  }

  /**
   * Generate unique customer number
   */
  private async generateCustomerNumber(): Promise<string> {
    const prefix = 'C';
    const randomNumber = Math.floor(Math.random() * 10000000).toString().padStart(7, '0');
    const customerNumber = `${prefix}${randomNumber}`;

    // Check if the generated number already exists
    const existing = await prisma.customer.findUnique({
      where: { customerNumber },
    });

    if (existing) {
      // Generate a new one recursively if it exists
      return this.generateCustomerNumber();
    }

    return customerNumber;
  }
}

// Export seeder functions for the main seeder
export const seedCustomers = async (): Promise<void> => {
  const seeder = new CustomersSeeder();
  await seeder.seed();
};

export const clearCustomers = async (): Promise<void> => {
  const seeder = new CustomersSeeder();
  await seeder.clear();
};