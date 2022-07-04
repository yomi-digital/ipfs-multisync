import { Web3Storage } from 'web3.storage'
import fs from 'fs'

const configs = JSON.parse(fs.readFileSync('./configs.json').toString())

function makeStorageClient() {
    return new Web3Storage({ token: configs.web3storage.jwt })
}


async function storeWithProgress(files) {
    const onRootCidReady = cid => {
        console.log('Uploading files to Web3Storage')
    }

    const totalSize = files.map(f => f.size).reduce((a, b) => a + b, 0)
    let uploaded = 0

    const onStoredChunk = size => {
        uploaded += size
        const pct = totalSize / uploaded * 100
        console.log(`Uploading... ${pct.toFixed(2)}% complete`)
    }

    const client = makeStorageClient()
    return client.put(files, { onRootCidReady, onStoredChunk })
}

export const pinFileToWeb3Storage = (path) => {
    return new Promise(async response => {
        if (configs.web3storage !== undefined && configs.web3storage.jwt !== undefined) {
            try {
                const file = fs.readFileSync(path)
                let files = [file]
                const uploaded = await storeWithProgress(files)
                response(uploaded)
            } catch (e) {
                response(false)
            }
        } else {
            response(false)
        }
    })
}

export function returnWeb3StoragePinList() {
    return new Promise(async response => {
        const client = makeStorageClient()
        let pinList = []
        for await (const pin of client.list()) {
            pinList.push({ date_pinned: pin.created, metadata: { name: pin.name }, cid: pin.cid, uri: configs.web3storage.endpoint + pin.cid })
        }
        response(pinList)
    })
}
