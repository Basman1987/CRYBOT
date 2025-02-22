import { Client, GatewayIntentBits, type TextChannel } from "discord.js"
import { ethers } from "ethers"

// Configure Discord client with minimal intents
const client = new Client({
  intents: [GatewayIntentBits.Guilds],
  rest: {
    version: "10",
  },
})

// Constants
const TOKEN_ADDRESS = "0xB770074eA2A8325440798fDF1c29B235b31922Ae"
const ROUTER_ADDRESS = "0x145863Eb42Cf62847A6Ca784e6416C1682b1b2Ae"
const WCRO = "0x5C7F8A570d578ED84E63fdFA7b1eE72dEae1AE23"
const USDC = "0xc21223249CA28397B4B6541dfFaEcC539BfF0c59"

const ROUTER_ABI = ["function getAmountsOut(uint amountIn, address[] memory path) view returns (uint[] memory amounts)"]
const ERC20_ABI = ["function symbol() view returns (string)", "function decimals() view returns (uint8)"]

export async function GET() {
  if (!process.env.DISCORD_TOKEN || !process.env.DISCORD_CHANNEL_ID) {
    return new Response("Missing environment variables", { status: 500 })
  }

  try {
    // Initialize blockchain connection
    const provider = new ethers.JsonRpcProvider("https://evm.cronos.org/")
    const router = new ethers.Contract(ROUTER_ADDRESS, ROUTER_ABI, provider)
    const token = new ethers.Contract(TOKEN_ADDRESS, ERC20_ABI, provider)

    // Get token info and price
    const [symbol, decimals] = await Promise.all([token.symbol(), token.decimals()])

    const amountIn = ethers.parseUnits("1", decimals)
    const amounts = await router.getAmountsOut(amountIn, [TOKEN_ADDRESS, WCRO, USDC])
    const price = Number(ethers.formatUnits(amounts[2], 6))

    // Initialize Discord client and send message
    await client.login(process.env.DISCORD_TOKEN)
    const channel = (await client.channels.fetch(process.env.DISCORD_CHANNEL_ID)) as TextChannel

    const message = `
📊 **${symbol} Price Update**
💵 Current Price: $${price.toFixed(6)}
⏰ Updated: ${new Date().toLocaleString()}
🔗 Contract: \`${TOKEN_ADDRESS}\`
    `

    await channel.send(message)
    await client.destroy() // Clean up connection

    return new Response("Price update sent successfully", { status: 200 })
  } catch (error) {
    console.error("Error:", error)
    return new Response(`Failed to update price: ${error instanceof Error ? error.message : "Unknown error"}`, {
      status: 500,
    })
  }
}

