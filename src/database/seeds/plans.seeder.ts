import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import csv from 'csv-parser';

const prisma = new PrismaClient();

interface PlanData {
  Category: string;
  Name: string;
  Price: string;
  Duration: string;
}

export async function cleanPlans() {
  console.log('Cleaning existing plans...');

  try {
    // Delete all existing plans
    const deletedPlans = await prisma.plan.deleteMany();
    console.log(`Cleaned ${deletedPlans.count} existing plans`);
  } catch (error) {
    console.error('Error cleaning plans:', error);
  }
}

export async function clearPlans(): Promise<void> {
  console.log('🗑️ Clearing existing plans...');

  try {
    // Delete all existing plans
    const deletedPlans = await prisma.plan.deleteMany();
    console.log(`✅ Plans cleared successfully! Removed ${deletedPlans.count} plans`);
  } catch (error) {
    console.error('❌ Error clearing plans:', error);
  }
}

export async function seedPlans() {
  console.log('Seeding plans...');

  try {
    // Read the CSV file
    const csvFilePath = path.join(__dirname, 'cleaned.csv');

    if (!fs.existsSync(csvFilePath)) {
      console.error('CSV file not found:', csvFilePath);
      return;
    }

    const plans: PlanData[] = [];

    // Parse CSV file
    await new Promise((resolve, reject) => {
      fs.createReadStream(csvFilePath)
        .pipe(csv())
        .on('data', (data: any) => {
          // Skip empty rows
          if (data.Category && data.Name && data.Price) {
            plans.push(data);
          }
        })
        .on('end', resolve)
        .on('error', reject);
    });

    console.log(`Found ${plans.length} plans in CSV`);

    // Process and insert plans
    let createdCount = 0;
    let skippedCount = 0;

    for (const planData of plans) {
      try {
        // Skip empty or invalid rows
        if (!planData.Category || !planData.Name || !planData.Price) {
          skippedCount++;
          continue;
        }

        // Clean up price (remove ₹ symbol and convert to number)
        const cleanPrice = parseFloat(planData.Price.replace('₹', '').trim());

        // Skip if price is not a valid number
        if (isNaN(cleanPrice)) {
          skippedCount++;
          continue;
        }

        // Determine plan type based on category (highest priority)
        let planType: string = 'BASIC'; // Default to BASIC

        if (
          planData.Category.includes('DDO Package') ||
          planData.Category.includes('DPO Packages')
        ) {
          planType = 'PREMIUM';
        } else if (planData.Category.includes('AlaCarte Packages')) {
          planType = 'STANDARD';
        } else if (planData.Category.includes('Broadcaster Packages')) {
          planType = 'BASIC';
        }

        // Parse duration as number
        const durationInMonths = parseInt(planData.Duration, 10);
        // If parsing fails, default to 1 month
        const validDuration = isNaN(durationInMonths) ? 1 : durationInMonths;

        // Check if plan already exists
        const existingPlan = await prisma.plan.findUnique({
          where: { name: planData.Name },
        });

        if (existingPlan) {
          // If plan exists, update it with the correct type based on category
          await prisma.plan.update({
            where: { name: planData.Name },
            data: {
              type: planType.toString(),
              description: `${planData.Category} - ${validDuration} month(s)`,
              price: cleanPrice,
              category: planData.Category,
              duration: planData.Duration, // Store original duration string
              months: validDuration, // Store parsed duration as number
              updatedAt: new Date(),
            },
          });
          skippedCount++;
          continue;
        }

        // Determine if it's a priority package
        const isPriority =
          planData.Category.includes('DDO Package') &&
          (planData.Name.includes('SUPREME') || planData.Name.includes('SMART'));

        // Create plan
        await prisma.plan.create({
          data: {
            name: planData.Name,
            description: `${planData.Category} - ${validDuration} month(s)`,
            type: planType.toString(),
            price: cleanPrice,
            channels: JSON.stringify([planData.Name]), // For now, just use the plan name as a channel
            category: planData.Category,
            duration: planData.Duration, // Store original duration string
            months: validDuration, // Store parsed duration as number
            isPriority: isPriority,
            isActive: true,
          },
        });

        createdCount++;
      } catch (error) {
        console.error(`Error processing plan ${planData.Name}:`, error);
        skippedCount++;
      }
    }

    console.log(
      `Plans seeding completed. Created: ${createdCount}, Skipped/Updated: ${skippedCount}`
    );
  } catch (error) {
    console.error('Error seeding plans:', error);
  } finally {
    await prisma.$disconnect();
  }
}
