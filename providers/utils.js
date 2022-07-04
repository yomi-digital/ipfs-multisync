import axios from 'axios'
import fs from 'fs'
import glob from 'glob'

export function fileExists(searcher) {
    return new Promise(response => {
        glob(searcher, {}, function (er, files) {
            if (files.length > 0) {
                response(true)
            } else {
                response(false)
            }
        })
    })
}

export async function downloadFile(fileUrl, outputLocationPath) {
    const writer = fs.createWriteStream(outputLocationPath);
    return axios({
        method: 'get',
        url: fileUrl,
        responseType: 'stream',
    }).then(response => {
        console.log("File type is:", response.headers['content-type'])
        const extension = response.headers['content-type'].split("/")[1]
        return new Promise((resolve, reject) => {
            response.data.pipe(writer);
            let error = null;
            writer.on('error', err => {
                error = err;
                writer.close();
                reject(err);
            });
            writer.on('close', () => {
                if (!error) {
                    fs.renameSync(outputLocationPath, outputLocationPath + "." + extension)
                    resolve(true);
                }
            });
        });
    });
}