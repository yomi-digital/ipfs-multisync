import { returnPinataPinList } from './providers/pinata.js'
import { returnWeb3StoragePinList } from './providers/web3storage.js'
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

        // Define final origin list
        let originList = []

        // Make a local copy of all files of origin provider
        for (let k in pinList) {
            let canParse = true
            if (
                argv.filter !== undefined &&
                pinList[k].metadata?.name?.toLowerCase().indexOf(argv.filter.toLowerCase()) === -1
            ) {
                canParse = false
            } else if (argv.filter !== undefined && pinList[k].metadata?.name === null) {
                canParse = false
            }

            if (canParse) {
                const exists = await fileExists("./storage/" + pinList[k].cid + "*")
                if (!exists) {
                    console.log("Downloading file # " + k + " from " + pinList[k].uri)
                    let downloaded = false
                    while (!downloaded) {
                        try {
                            downloaded = await downloadFile(pinList[k].uri, "./storage/" + pinList[k].cid)
                            if (!downloaded) {
                                console.log("Download failed, retry..")
                            }
                        } catch (e) {
                            console.log("Download failed, retry..")
                        }
                    }
                    const percentage = k / pinList.length * 100
                    console.log("Parsed " + percentage + "% of list..")
                } else {
                    console.log("Ignoring " + pinList[k].cid + ", already downloaded.")
                }
                originList.push(pinList[k])
                console.log('--')
            }
        }

        // Pin all files to destination provider
        const destinationList = await returnWeb3StoragePinList()
        for (let k in originList) {
            let found = false
            for (let j in destinationList) {
                if (destinationList[j].cid === originList[k].cid) {
                    console.log("Pin already found in " + argv.to + ':', originList[k].cid)
                    found = true
                }
            }
            if (!found) {
                if (argv.to === 'web3storage') {
                    await pinFileToWeb3Storage(originList[k].cid)
                }
            }
        }
    } else {
        console.log("No pins found in " + argv.from + " provider.")
    }
} else {
    console.log("Please provide --from and --to arguments")
}