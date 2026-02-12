// scripts/seedData.js
import mongoose from "mongoose";
import dotenv from "dotenv";
import Docket from "../models/Docket.js";
import BookingInfo from "../models/BookingInfo.js";
import Invoice from "../models/Invoice.js";
import Consignor from "../models/Consignor.js";
import Consignee from "../models/Consignee.js";
import DocketCounter from "../models/DocketCounter.js";

// Load environment variables
dotenv.config();

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB Connected");
  } catch (error) {
    console.error("❌ MongoDB Connection Error:", error.message);
    process.exit(1);
  }
};

// Indian Cities for realistic data
const cities = [
  "Delhi", "Mumbai", "Bangalore", "Hyderabad", "Chennai",
  "Kolkata", "Pune", "Ahmedabad", "Jaipur", "Surat",
  "Lucknow", "Kanpur", "Nagpur", "Indore", "Thane",
  "Bhopal", "Visakhapatnam", "Patna", "Vadodara", "Ghaziabad"
];

// Company names for consignors/consignees
const companyNames = [
  "Tech Solutions Pvt Ltd", "Global Traders", "Prime Industries",
  "Elite Exports", "Supreme Logistics", "Apex Manufacturing",
  "Royal Enterprises", "Crown Distributors", "Mega Corp",
  "Universal Trading Co", "Pacific Industries", "Atlantic Exports",
  "Sunrise Trading", "Moonlight Enterprises", "Star Industries",
  "Diamond Exports", "Golden Traders", "Silver Corp",
  "Platinum Industries", "Bronze Enterprises"
];

// Random date generator
const randomDate = (start, end) => {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
};

// Random number generator
const randomNumber = (min, max) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

// Random choice from array
const randomChoice = (arr) => {
  return arr[Math.floor(Math.random() * arr.length)];
};

// Generate random E-way bill number
const generateEwayBill = () => {
  return Math.floor(100000000000 + Math.random() * 900000000000).toString();
};

// Generate random invoice number
const generateInvoiceNo = () => {
  return `INV${Math.floor(100000 + Math.random() * 900000)}`;
};

// Generate random phone number
const generatePhone = () => {
  return `${randomNumber(7, 9)}${Math.floor(1000000000 + Math.random() * 9000000000)}`.substring(0, 10);
};

// Generate random GSTIN
const generateGSTIN = () => {
  const stateCode = randomNumber(10, 35);
  const panLike = Math.random().toString(36).substring(2, 12).toUpperCase();
  return `${stateCode}${panLike}1Z5`;
};

// Calculate E-way bill expiry based on distance
const calculateEwayBillExpiry = (bookingDate, distance) => {
  let validityDays = 1; // Base validity
  
  if (distance <= 100) {
    validityDays = 1;
  } else if (distance <= 300) {
    validityDays = 3;
  } else if (distance <= 500) {
    validityDays = 5;
  } else if (distance <= 1000) {
    validityDays = 10;
  } else {
    validityDays = 15;
  }
  
  const expiryDate = new Date(bookingDate);
  expiryDate.setDate(expiryDate.getDate() + validityDays);
  return expiryDate;
};

// Seed function
const seedData = async () => {
  try {
    console.log("🗑️  Clearing existing data...");
    
    // Clear all existing data
    await Docket.deleteMany({});
    await BookingInfo.deleteMany({});
    await Invoice.deleteMany({});
    await Consignor.deleteMany({});
    await Consignee.deleteMany({});
    
    console.log("✅ Existing data cleared");
    
    console.log("🌱 Seeding 20 dockets with related data...");
    
    // Update or create DocketCounter
    let counter = await DocketCounter.findById("auto-docket-counter");
    if (!counter) {
      counter = new DocketCounter({
        _id: "auto-docket-counter",
        lastNumber: 53220,
        prefix: "05"
      });
      await counter.save();
    }
    
    const startDate = new Date("2024-01-01");
    const endDate = new Date();
    
    for (let i = 1; i <= 20; i++) {
      console.log(`\n📦 Creating docket ${i}/20...`);
      
      // Generate docket number
      const docketNumber = counter.lastNumber + i;
      const docketNo = `${counter.prefix}${docketNumber}`;
      
      // Random dates
      const bookingDate = randomDate(startDate, endDate);
      const expectedDelivery = new Date(bookingDate);
      expectedDelivery.setDate(expectedDelivery.getDate() + randomNumber(3, 10));
      
      // Random cities
      const originCity = randomChoice(cities);
      let destinationCity = randomChoice(cities);
      // Ensure origin and destination are different
      while (destinationCity === originCity) {
        destinationCity = randomChoice(cities);
      }
      
      // Calculate distance (mock calculation - random between 100-1500 km)
      const distance = randomNumber(100, 1500);
      
      // 1. Create Consignor
      const consignorData = new Consignor({
        isTemporary: Math.random() > 0.5,
        consignorName: randomChoice(companyNames),
        address: `${randomNumber(1, 999)}, ${randomChoice(["MG Road", "Ring Road", "Main Street", "Industrial Area"])}`,
        city: originCity,
        pin: `${randomNumber(100000, 999999)}`,
        state: originCity === "Delhi" ? "Delhi" : originCity === "Mumbai" ? "Maharashtra" : "Karnataka",
        phone: generatePhone(),
        crgstinNo: generateGSTIN(),
      });
      const savedConsignor = await consignorData.save();
      
      // 2. Create Consignee
      const consigneeData = new Consignee({
        isTemporary: Math.random() > 0.3,
        consigneeName: randomChoice(companyNames.filter(name => name !== consignorData.consignorName)),
        address: `${randomNumber(1, 999)}, ${randomChoice(["Park Road", "Sector", "Avenue", "Boulevard"])}`,
        city: destinationCity,
        pin: `${randomNumber(100000, 999999)}`,
        state: destinationCity === "Delhi" ? "Delhi" : destinationCity === "Mumbai" ? "Maharashtra" : "Karnataka",
        phone: generatePhone(),
        cegstinNo: generateGSTIN(),
      });
      const savedConsignee = await consigneeData.save();
      
      // 3. Generate dimensions (1-3 dimension rows)
      const dimensionsCount = randomNumber(1, 3);
      const dimensions = [];
      for (let j = 0; j < dimensionsCount; j++) {
        dimensions.push({
          length: randomNumber(10, 100),
          width: randomNumber(10, 100),
          height: randomNumber(10, 100),
          noOfPackets: randomNumber(1, 10),
        });
      }
      
      // 4. Create Docket
      const docketData = new Docket({
        docketNo,
        bookingDate,
        destinationCity,
        postalCode: `${randomNumber(100000, 999999)}`,
        expectedDelivery,
        consignor: savedConsignor._id,
        consignee: savedConsignee._id,
        dimensions,
        isAutoGenerated: true,
        distance,
        docketStatus: 'Active',
        rto: false,
        coLoader: Math.random() > 0.7, // 30% chance of co-loader
      });
      const savedDocket = await docketData.save();
      
      // 5. Create BookingInfo
      const bookingInfoData = new BookingInfo({
        docketId: savedDocket._id,
        customerType: randomChoice(["Contractual Client", "Regular"]),
        bookingMode: randomChoice(["ROAD", "AIR", "RAIL", "SEA"]),
        originCity,
        billingParty: randomChoice(companyNames),
        billingAt: randomChoice(cities),
        bookingType: randomChoice(["To Pay", "Paid", "Credit"]),
        deliveryMode: randomChoice(["Door Delivery", "Godown Delivery"]),
        loadType: randomChoice(["PTL", "FTL"]),
        gstinNo: generateGSTIN(),
      });
      await bookingInfoData.save();
      
      // 6. Create Invoice with E-way Bill
      const eWayBill = generateEwayBill();
      const invoiceDate = new Date(bookingDate);
      invoiceDate.setDate(invoiceDate.getDate() - randomNumber(0, 3));
      const eWayBillExpiry = calculateEwayBillExpiry(bookingDate, distance);
      
      const invoiceData = new Invoice({
        eWayBill,
        invoiceNo: generateInvoiceNo(),
        invoiceDate,
        partNo: `PART${randomNumber(1000, 9999)}`,
        itemDescription: randomChoice([
          "Electronic Components",
          "Auto Parts",
          "Machinery Equipment",
          "Textile Products",
          "Chemical Products",
          "Food Items",
          "Medical Supplies",
          "Hardware Tools"
        ]),
        weight: randomNumber(10, 500),
        packet: randomNumber(1, 20),
        netInvoiceValue: randomNumber(10000, 500000),
        grossInvoiceValue: randomNumber(12000, 600000),
        docket: savedDocket._id,
        bookingInfo: bookingInfoData._id,
        consignor: savedConsignor._id,
        consignee: savedConsignee._id,
        eWayBillExpiry,
      });
      await invoiceData.save();
      
      console.log(`✅ Docket ${docketNo} created successfully`);
    }
    
    // Update the counter
    counter.lastNumber = counter.lastNumber + 20;
    await counter.save();
    
    console.log("\n🎉 Seed completed successfully!");
    console.log(`📊 Created:`);
    console.log(`   - 20 Dockets`);
    console.log(`   - 20 Invoices with E-way Bills`);
    console.log(`   - 20 BookingInfo records`);
    console.log(`   - 20 Consignors`);
    console.log(`   - 20 Consignees`);
    console.log(`   - Updated DocketCounter`);
    
  } catch (error) {
    console.error("❌ Error seeding data:", error);
  } finally {
    await mongoose.connection.close();
    console.log("\n🔌 MongoDB connection closed");
    process.exit(0);
  }
};

// Run seed
connectDB().then(() => {
  seedData();
});