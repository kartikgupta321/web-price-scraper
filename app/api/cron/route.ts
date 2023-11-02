import Product from "@/lib/models/product.model";
import { scrapeAmazonProduct } from "@/lib/scraper";
import { connectToDB } from "@/lib/scraper/mongoose";
import { getLowestPrice, getHighestPrice, getAveragePrice } from "@/lib/utils";

export async function GET() {
    try {
        connectToDB();
        const products = await Product.find({});

        if (!products) throw new Error("No products found");

        // 1. scrape latest product details and update db
        const updatedProducts = await Promise.all(
            products.map(async (currentProduct) => {
                const scrapedProduct = await scrapeAmazonProduct(currentProduct.url);
                if (!scrapedProduct) throw new Error("No products found");

                const updatedPriceHistory = [
                    ...currentProduct.priceHistory,
                    { price: scrapedProduct.currentPrice }
                ]
                const product = {
                    ...scrapedProduct,
                    priceHistory: updatedPriceHistory,
                    lowestPrice: getLowestPrice(updatedPriceHistory),
                    highestPrice: getHighestPrice(updatedPriceHistory),
                    averagePrice: getAveragePrice(updatedPriceHistory),
                }

                const updatedProduct = await Product.findOneAndUpdate(
                    { url: scrapedProduct.url },
                    product,
                );

                // 2. check each product's status and send email accordingly
                

            })
        )

    } catch (error) {
        throw new Error(`Error in GET: ${error}`);
    }
}