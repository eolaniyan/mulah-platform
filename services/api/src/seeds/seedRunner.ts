import { db } from "../db";
import { serviceDirectory, servicePlans, appConfig, categories } from "@shared/schema";
import { serviceDirectorySeed } from "./serviceDirectory";
import { servicePlansSeed } from "./servicePlansSeed";
import { appConfigSeed } from "./appConfig";
import { categorySeed } from "./categorySeed";
import { eq } from "drizzle-orm";

export async function seedAppConfig() {
  console.log("Seeding app configuration...");
  for (const config of appConfigSeed) {
    const existing = await db.select().from(appConfig).where(eq(appConfig.key, config.key));
    if (existing.length === 0) {
      await db.insert(appConfig).values(config);
      console.log(`  Added config: ${config.key}`);
    }
  }
  console.log("App configuration seeded.");
}

export async function seedCategories() {
  console.log("Seeding categories...");
  for (const category of categorySeed) {
    const existing = await db.select().from(categories).where(eq(categories.slug, category.slug));
    if (existing.length === 0) {
      await db.insert(categories).values(category);
      console.log(`  Added category: ${category.name}`);
    }
  }
  console.log("Categories seeded.");
}

export async function seedServiceDirectory() {
  console.log("Seeding service directory...");
  for (const service of serviceDirectorySeed) {
    const existing = await db.select().from(serviceDirectory).where(eq(serviceDirectory.slug, service.slug));
    if (existing.length === 0) {
      await db.insert(serviceDirectory).values(service);
      console.log(`  Added service: ${service.name}`);
    }
  }
  console.log("Service directory seeded.");
}

export async function seedServicePlans() {
  console.log("Seeding service plans...");
  for (const servicePlanData of servicePlansSeed) {
    const service = await db.select().from(serviceDirectory).where(eq(serviceDirectory.slug, servicePlanData.serviceSlug));
    if (service.length === 0) {
      console.log(`  Skipping plans for ${servicePlanData.serviceSlug} - service not found`);
      continue;
    }
    const serviceId = service[0].id;
    
    for (const plan of servicePlanData.plans) {
      const existing = await db.select().from(servicePlans)
        .where(eq(servicePlans.serviceId, serviceId));
      const planExists = existing.some(p => p.name === plan.name);
      
      if (!planExists) {
        await db.insert(servicePlans).values({
          ...plan,
          serviceId: serviceId
        });
        console.log(`  Added plan: ${servicePlanData.serviceSlug} - ${plan.name}`);
      }
    }
  }
  console.log("Service plans seeded.");
}

export async function runAllSeeds() {
  try {
    await seedAppConfig();
    await seedCategories();
    await seedServiceDirectory();
    await seedServicePlans();
    console.log("All seeds completed successfully!");
  } catch (error) {
    console.error("Seed error:", error);
    throw error;
  }
}
