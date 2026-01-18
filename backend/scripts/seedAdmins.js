// scripts/seedAdmins.js
import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../models/User.js";

// Load environment variables
dotenv.config();

// Admin accounts data
const admins = [
  {
    name: "Admin One",
    username: "admin101",
    email: "admin101@urbanclub.com",
    password: "pas202601",
    role: "admin",
  },
  {
    name: "Admin Two",
    username: "admin102",
    email: "admin102@urbanclub.com",
    password: "pas202602",
    role: "admin",
  },
  {
    name: "Admin Three",
    username: "admin103",
    email: "admin103@urbanclub.com",
    password: "pas202603",
    role: "admin",
  },
];

const seedAdmins = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");

    // Check if admins already exist
    const existingAdmins = await User.find({ role: "admin" });
    
    if (existingAdmins.length > 0) {
      console.log("⚠️  Admin accounts already exist!");
      console.log("Existing admins:", existingAdmins.map(a => a.username).join(", "));
      
      const readline = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout
      });
      
      readline.question('Do you want to recreate admin accounts? (yes/no): ', async (answer) => {
        if (answer.toLowerCase() === 'yes') {
          await User.deleteMany({ role: "admin" });
          console.log("🗑️  Deleted existing admin accounts");
          await createAdmins();
        } else {
          console.log("❌ Cancelled. No changes made.");
          process.exit(0);
        }
        readline.close();
      });
    } else {
      await createAdmins();
    }
  } catch (error) {
    console.error("❌ Error seeding admins:", error);
    process.exit(1);
  }
};

const createAdmins = async () => {
  try {
    // Create admin accounts
    for (const adminData of admins) {
      const admin = await User.create(adminData);
      console.log(`✅ Created admin: ${admin.username} (${admin.email})`);
    }

    console.log("\n🎉 Admin accounts created successfully!");
    console.log("\n📋 Admin Credentials:");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    admins.forEach((admin) => {
      console.log(`Username: ${admin.username}`);
      console.log(`Password: ${admin.password}`);
      console.log(`Email: ${admin.email}`);
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    });

    process.exit(0);
  } catch (error) {
    console.error("❌ Error creating admins:", error);
    process.exit(1);
  }
};

// Run the seeder
seedAdmins();