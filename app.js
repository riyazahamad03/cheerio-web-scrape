const express = require("express");
const axios = require("axios"); 
const cheerio = require("cheerio");
const TelegramBot = require("node-telegram-bot-api");
const token = "Your Token";
const chatId = "Your chat id";
const port = process.env.PORT || 4000;
const bot = new TelegramBot(token, {
  polling: true,
  filepath: false,
  onlyFirstMatch: true,
  log: true,
});
const app = express();

// List to store all the Asin
let asinSet = new Map();
const defaultDisc = 70;
const logic = () => {
  if (asinSet.size > 0) {
    for (let [asin, disc] of asinSet) {
      const Link = "https://www.amazon.in/dp/" + asin;
      console.log(asin);
      axios
        .get(Link)
        .then((response) => {
          const $ = cheerio.load(response.data);
          const title = $("#productTitle").text().trim();
          const currentPrice1 = $("#corePriceDisplay_desktop_feature_div")
            .find(".a-price-whole")
            .text()
            .replace(",", "")
            .trim();
          const pricesArray = $("#corePrice_desktop")
            .find(".a-lineitem")
            .find('.a-color-secondary.a-size-base:contains("Price:")')
            .next()
            .find(".a-text-price.a-size-medium.apexPriceToPay")
            .find(".a-offscreen")
            .text()
            .replace("₹", "")
            .replace(",", "")
            .trim();
          const currentPrice2 = pricesArray.split("₹")[0];

          const originalPrice1 = $("#corePriceDisplay_desktop_feature_div")
            .find(".basisPrice")
            .find(".a-offscreen")
            .text()
            .replace("₹", "")
            .replace(",", "")
            .trim();

          const originalPrice2 = $("#corePrice_desktop")
            .find(".a-span12.a-color-secondary.a-size-base")
            .find(".a-offscreen")
            .text()
            .replace("₹", "")
            .replace(",", "")
            .trim();

          const sp = currentPrice1 || currentPrice2;
          const mrp = originalPrice1 || originalPrice2;
          // console.log(asinSet.get(asin));
          // console.log(mrp, sp);

          let discountPercentage =
            ((parseFloat(mrp) - parseFloat(sp)) / parseFloat(mrp)) * 100;

          discountPercentage = Math.round(discountPercentage * 100) / 100;
          const userDisc = asinSet.get(asin);
          if (discountPercentage >= userDisc) {
            bot.sendMessage(
              chatId,
              `Link : ${Link} \n\n Product Name : ${title} \n\n Product Price : ${parseInt(
                sp
              )} \n\n Discount Percentage : ${discountPercentage}`
            );
          }
        })

        .catch(() => {
          console.log("Error in service");
        });
    }
  }
};

bot.onText(/\/command1 (.+)/, (msg, match) => {
  console.log("asin  received:", msg.text);
  const chatId = msg.chat.id;
  const receivedText = match[1].split(" ");
  const asin = receivedText[0];
  const disc = parseInt(receivedText[1]);
  asinSet.set(asin, disc || defaultDisc);
  console.log(asinSet);
  bot.sendMessage(chatId, `Received ${asin} added to list Thank you`);
});

setInterval(logic, 6000);
app.listen(port, () => {
  console.log(`Server Established ${port}`);
});
