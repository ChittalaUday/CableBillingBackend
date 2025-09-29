import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import csv from 'csv-parser';

const prisma = new PrismaClient();

interface PlanData {
  category: string;
  name: string;
  price: string;
  duration: string;
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
          if (data.category && data.name && data.price) {
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
        if (!planData.category || !planData.name || !planData.price) {
          skippedCount++;
          continue;
        }

        // Clean up price (remove ₹ symbol and convert to number)
        const cleanPrice = parseFloat(planData.price.replace('₹', '').trim());

        // Skip if price is not a valid number
        if (isNaN(cleanPrice)) {
          skippedCount++;
          continue;
        }

        // Determine plan type based on category (highest priority)
        let planType: string = 'BASIC'; // Default to BASIC

        if (planData.category.includes('DPO Packages')) {
          planType = 'PREMIUM';
        } else if (planData.category.includes('AlaCarte Packages')) {
          planType = 'STANDARD';
        } else if (planData.category.includes('Broadcaster Packages')) {
          planType = 'BASIC';
        }

        // Check if plan already exists
        const existingPlan = await prisma.plan.findUnique({
          where: { name: planData.name },
        });

        if (existingPlan) {
          // If plan exists, update it with the correct type based on category
          await prisma.plan.update({
            where: { name: planData.name },
            data: {
              type: planType.toString(),
              description: `${planData.category} - ${planData.duration}`,
              price: cleanPrice,
              // Store only duration and category instead of the entire object
              packageDetails: JSON.stringify({
                duration: planData.duration,
                category: planData.category
              }),
              updatedAt: new Date(),
            },
          });
          skippedCount++;
          continue;
        }

        // Determine months from name pattern by splitting on underscores
        let months = 1; // Default to 1 month

        // Look for month indicators in the name parts
        const nameParts = planData.name.split('_');
        for (const part of nameParts) {
          if (part.match(/^\d+$/)) {
            // Check if part is a number
            const num = parseInt(part, 10);
            if (num === 1 || num === 3 || num === 6 || num === 12) {
              months = num;
              break;
            }
          } else if (part.includes('MONTHS')) {
            // Handle patterns like "03_MONTHS"
            const monthMatch = part.match(/(\d+)_MONTHS/i);
            if (monthMatch && monthMatch[1]) {
              months = parseInt(monthMatch[1], 10);
              break;
            }
          }
        }

        // Determine if it's a priority package
        const isPriority =
          planData.category.includes('DPO Packages') &&
          (planData.name.includes('SUPREME') || planData.name.includes('SMART'));

        // Create plan
        await prisma.plan.create({
          data: {
            name: planData.name,
            description: `${planData.category} - ${planData.duration}`,
            type: planType.toString(),
            price: cleanPrice,
            channels: JSON.stringify([planData.name]), // For now, just use the plan name as a channel
            // Store only duration and category instead of the entire object
            packageDetails: JSON.stringify({
              duration: planData.duration,
              category: planData.category
            }),
            months: months,
            isPriority: isPriority,
            isActive: true,
          },
        });

        createdCount++;
      } catch (error) {
        console.error(`Error processing plan ${planData.name}:`, error);
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