import axios from 'axios'
import { createWalletClient, http } from 'viem'
import { bsc } from 'viem/chains'
import { privateKeyToAccount } from 'viem/accounts'
import fs from 'fs'
import chalk from 'chalk';
import { ABI } from './abi'

const log = console.log;

const start = async (key: `0x${string}`) => {
    const account = privateKeyToAccount(key)
    const client = createWalletClient({
        account,
        chain: bsc,
        transport: http(),
      })

      try{
        const message = `Thank you for your support of Lista DAO. Sign in to view airdrop details.`
        const signature = await client.signMessage({account, message})
        const reponse = await axios.get(`https://api.lista.org/api/airdrop/proof?address=${account.address}&message=Thank+you+for+your+support+of+Lista+DAO.+Sign+in+to+view+airdrop+details.&signature=${signature}`)
        const proof = reponse.data.data.proof
        if(!proof) {
          log(chalk.blue(account.address + ": ") + chalk.red("Not eligible"))
          return
        }
        log(reponse.data.data)
        
        const hash = await client.writeContract({
          address: "0x2ed866ca9c33bf695c78af222d61bd4d9cb558d3",
          'abi': ABI,
          'functionName': 'claim',
          account,
          args: [account.address,reponse.data.data.amountWei,proof]
        })
        log(chalk.blue(account.address + ": ") + chalk.green(`claimed ${reponse.data.data.amount}`) + "-" + hash)
      } catch(e) {
        log(chalk.blue(account.address + ": ") + e.message)
      }
}

const fileContents = fs.readFileSync('./keys/keys.txt', 'utf-8')
const keys = [...new Set(fileContents.split('\n'))].map((i) => i.trim()).filter((i) => i.length > 0) as `0x${string}`[]

for (const key of keys ) {
    try{
        await start(key)
    }
    catch(e) {
        console.log(e.message)
    }
}
