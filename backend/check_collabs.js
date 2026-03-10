require("dotenv").config({ path: "./.env" });
const mongoose = require("mongoose");
const Collaboration = require("./src/models/Collaboration");

async function checkDB() {
  await mongoose.connect(process.env.MONGO_URI);
  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);
  
  const result = await Collaboration.updateOne(
      { status: "EXPIRED" },
      { 
          $set: { 
              status: "ACCEPTED", 
              expiresAt: nextWeek 
          } 
      }
  );
  console.log("Updated collaboration:", result);
  process.exit(0);
}

checkDB();
