import { returnPinataPinList } from './providers/pinata.js'
import { downloadFile, fileExists } from './providers/utils.js'
import minimist from 'minimist'
import fs from 'fs'
const argv = minimist(process.argv.slice(2))

if (argv.from !== undefined && argv.to !== undefined) {
    console.log("Syncing from `", argv.from, "` to `", argv.to, "`")
    let pinList = []
    if (argv.from === "pinata") {
        pinList = await returnPinataPinList()
    }
    if (argv.from === "disk" && argv.file !== undefined) {
        try {
            pinList = JSON.parse(fs.readFileSync(argv.file).toString())
        } catch (e) {
            console.log(e.message)
        }
    }
    if (pinList.length > 0) {
        console.log("Found " + pinList.length + " pins.")
        if (argv.from !== "disk") {
            console.log("Saving pin list for future uses.")
            fs.writeFileSync("reports/REPORT_PINLIST_" + argv.from.toUpperCase() + "_" + new Date().getTime() + ".json", JSON.stringify(pinList, null, 4))
        }

        for (let k in pinList) {
            const exists = await fileExists("./storage/" + pinList[k].cid + "*")
            if (!exists) {
                console.log("Downloading file # " + k + " from " + pinList[k].uri)
                await downloadFile(pinList[k].uri, "./storage/" + pinList[k].cid)
                const percentage = k / pinList.length * 100
                console.log("Parsed " + percentage + "% of list..")
            } else {
                console.log("Ignoring " + pinList[k].cid + ", already downloaded.")
            }
        }
    } else {
        console.log("No pins found in " + argv.from + " provider.")
    }
} else {
    console.log("Please provide --from and --to arguments")
}