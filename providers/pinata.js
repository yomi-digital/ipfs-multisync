import axios from 'axios'
import fs from 'fs'

export const returnPinataPinList = async () => {
    const configs = JSON.parse(fs.readFileSync('./configs.json').toString())
    if (configs.pinata !== undefined && configs.pinata.jwt !== undefined) {
        let page = 0
        let pins = []
        let found = true
        while (found) {
            try {
                const res = await axios({
                    method: 'get',
                    url: 'https://api.pinata.cloud/data/pinList?status=pinned&pageLimit=1000&pageOffset=' + page,
                    headers: {
                        'Authorization': "Bearer " + configs.pinata.jwt
                    }
                });
                console.log('Found ' + res.data.rows.length + ' more pins, adding them to list..')
                let added = 0
                for (let k in res.data.rows) {
                    const pin = res.data.rows[k]
                    if (pins.indexOf(pin.ipfs_pin_hash) === -1) {
                        pins.push({ date_pinned: pin.date_pinned, metadata: pin.metadata, cid: pin.ipfs_pin_hash, uri: configs.pinata.endpoint + pin.ipfs_pin_hash })
                        added++
                    }
                }
                page += res.data.rows.length
                console.log("-> Added " + added + " files to list.")
                if (added === 0) {
                    found = false
                }
            } catch (e) {
                console.log(e.message)
                found = false;
            }
        }
        return pins
    } else {
        console.log("Can't find pinata JWT in config file")
        return false
    }
}