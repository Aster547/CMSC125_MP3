var path = require('path');
var csv = require('jquery-csv');
var fs = require('fs');

const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
});

readline.question('Enter filename: ', filename => {
    main(filename.trim());
});

function main(filename) {
    const jobListPath = path.join(__dirname, 'input', 'jobList', filename); 
    const memListPath = path.join(__dirname, 'input', 'memoryList', 'memList1.csv'); 

    fs.readFile(jobListPath, 'utf8', (err, data) => {
        if (err) {
            console.error("Error reading jobList file:", err);
            return;
        }

        // Remove BOM if present
        if (data.charCodeAt(0) === 0xFEFF) {
            data = data.slice(1);
        }

        let jobList = csv.toObjects(data);

        // Clean keys and values
        jobList = jobList.map(p => {
            const cleaned = {};
            for (let key in p) {
                cleaned[key.trim()] = p[key].trim();
            }
            return cleaned;
        });

        //console.log(jobList);

        fs.readFile(memListPath, 'utf8', (err, data) => {
            if (err) {
                console.error("Error reading memList file:", err);
                return;
            }   
            
            // Remove BOM if present
            if (data.charCodeAt(0) === 0xFEFF) {
                data = data.slice(1);
            }

            let memList = csv.toObjects(data);

            // Clean keys and values
            memList = memList.map(p => {
                const cleaned = {};
                for (let key in p) {
                    cleaned[key.trim()] = p[key].trim();
                }
                return cleaned;
            });

            //console.log(memList);

        });

    });
}

function firstFit(jobList, memList) {

    const processList = [];

    for (let i = 0; i<jobList.length; i++){

        for (let j = 0; j<memList.length; j++){
            if (jobList.jobSize<=memList.memSize){

                processList({memBlock: Number(memList.Block), processes.push(jobList[i])});
            }
        }
    }
}

