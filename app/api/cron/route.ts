import Product from "@/lib/models/product.model";
import { generateEmailBody, sendEmail } from "@/lib/nodemailer";
import { scrapeAmazonProduct } from "@/lib/scraper";
import { connectToDB } from "@/lib/scraper/mongoose";
import { getLowestPrice, getHighestPrice, getAveragePrice, getEmailNotifType } from "@/lib/utils";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: Request) {
    try {
        connectToDB();
        const products = await Product.find({});

        if (!products) throw new Error("No products found");

        // 1. scrape latest product details and update db
        const updatedProducts = await Promise.all(
            products.map(async (currentProduct) => {
                // scrape product
                const scrapedProduct = await scrapeAmazonProduct(currentProduct.url);
                if (!scrapedProduct) return;

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
                // update products in db
                const updatedProduct = await Product.findOneAndUpdate(
                    { url: product.url },
                    product,
                );

                // 2. check each product's status and send email accordingly
                const emailNotifType = getEmailNotifType(scrapedProduct, currentProduct);

                if(emailNotifType && updatedProduct.users.length > 0){
                    const productInfo = {
                        title: updatedProduct.title,
                        url: updatedProduct.url,
                    }
                    // construct emailContent
                    const emailContent = await generateEmailBody(productInfo, emailNotifType);
                    // get array of user emails
                    const userEmails = updatedProduct.users.map((user: any) => user.email);
                    // send email notification
                    await sendEmail(emailContent, userEmails);
                }
                return updatedProduct;

            })
        )
        return NextResponse.json({
            message: 'ok', data: updatedProducts
        })
    } catch (error) {
        throw new Error(`Error in GET: ${error}`);
    }
}