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


function firstFit(jobList, memList) {

    let processList = Array(memList.length).fill(null).map(() => []);
    let nextCycle = [];
    let otherCycles = [];
    let saveIter = 0;
    
    if (jobList.length != 0){

        for (let i = 0; i<jobList.length; i++) {

            for (let j = saveIter, k = 0; k<memList.length; j++, k++){
                if (j==memList.length){
                    nextCycle.push({jobStream: jobList[i].jobStream, time: jobList[i].time, jobSize: jobList[i].jobSize});
                    j=0;
                    break;
                }

                if (Number(jobList[i].jobSize)<=Number(memList[j].memSize) && saveIter == j) {
                    processList[j].push({job: Number(jobList[i].jobStream), time: Number(jobList[i].time), jobSize: Number(jobList[i].jobSize)});
                    saveIter++;
                    if (saveIter==memList.length)
                        saveIter = 0;
                    break
                }

                else if (Number(jobList[i].jobSize)<=Number(memList[j].memSize)) {
                    processList[j].push({job: Number(jobList[i].jobStream), time: Number(jobList[i].time), jobSize: Number(jobList[i].jobSize)});
                    break;
                }
            }

            otherCycles = firstFit(nextCycle, memList);
        }
    }
    return merge2DArrays(processList, otherCycles);
}

function worstFit(jobList, memList){

    let processList = Array(memList.length).fill(null).map(() => []);
    let nextCycle = [];
    let otherCycles = [];
    let saveIter = 0;

    let worstOrder = [...memList];

    worstOrder.sort((a, b) => {
        return  Number(b.memSize) - Number(a.memSize);
    });

    //console.log(worstOrder);

    
    if (jobList.length != 0){

        for (let i = 0; i<jobList.length; i++) {

            for (let j = saveIter, k = 0; k<memList.length; j++, k++){
                if (j==memList.length){
                    nextCycle.push({jobStream: jobList[i].jobStream, time: jobList[i].time, jobSize: jobList[i].jobSize});
                    j=0;
                    break;
                }

                if (Number(jobList[i].jobSize)<=Number(worstOrder[j].memSize) && saveIter == j) {
                    processList[Number(worstOrder[j].memBlock-1)].push({job: Number(jobList[i].jobStream), time: Number(jobList[i].time), jobSize: Number(jobList[i].jobSize)});
                    saveIter++;
                    if (saveIter==memList.length)
                        saveIter = 0;
                    break
                }

                else if (Number(jobList[i].jobSize)<=Number(worstOrder[j].memSize)) {
                    processList[Number(worstOrder[j].memBlock-1)].push({job: Number(jobList[i].jobStream), time: Number(jobList[i].time), jobSize: Number(jobList[i].jobSize)});
                    break;
                }
            }

            otherCycles = worstFit(nextCycle, memList);
        }
    }
    return merge2DArrays(processList, otherCycles);
}

function bestFit(jobList, memList){

    let processList = Array(memList.length).fill(null).map(() => []);
    let nextCycle = [];
    let otherCycles = [];
    let saveIter = 0;

    let bestOrder = [...memList];

    bestOrder.sort((a, b) => {
        return Number(a.memSize)-Number(b.memSize) ;
    });

    //console.log(worstOrder);

    
    if (jobList.length != 0){

        for (let i = 0; i<jobList.length; i++) {

            for (let j = saveIter, k = 0; k<memList.length; j++, k++){
                if (j==memList.length){
                    nextCycle.push({jobStream: jobList[i].jobStream, time: jobList[i].time, jobSize: jobList[i].jobSize});
                    j=0;
                    break;
                }

                if (Number(jobList[i].jobSize)<=Number(bestOrder[j].memSize) && saveIter == j) {
                    processList[Number(bestOrder[j].memBlock-1)].push({job: Number(jobList[i].jobStream), time: Number(jobList[i].time), jobSize: Number(jobList[i].jobSize)});
                    saveIter++;
                    if (saveIter==memList.length)
                        saveIter = 0;
                    break
                }

                else if (Number(jobList[i].jobSize)<=Number(bestOrder[j].memSize)) {
                    processList[Number(bestOrder[j].memBlock-1)].push({job: Number(jobList[i].jobStream), time: Number(jobList[i].time), jobSize: Number(jobList[i].jobSize)});
                    break;
                }
            }

            otherCycles = bestFit(nextCycle, memList);
        }
    }
    return merge2DArrays(processList, otherCycles);
}

function internalFrag(memList, processList){

    let internalFragmentation = 0;
    let procList = processList.map(queue => [...queue]); 

    /*
    for (let i = 0; procList.some((process) => process.length > 0); i++){
        if (i == processList.length)
            i = 0;

        if (procList[i].length>0){
            internalFragmentation += (Number(memList[i].memSize) - procList[i][0].jobSize);
            procList[i].shift();
        }
    }
    */

    for (let i = 0; i<procList.length; i++){
        if (procList[i].length>0)
            internalFragmentation += (Number(memList[i].memSize) - procList[i][0].jobSize);
    }

    return internalFragmentation;

}

function memUtil (memList, processList) {
    const totalMemSize = memList.reduce((sum, block) => sum + Number(block.memSize), 0);
    let allocatedMemory = 0;

    for (let i = 0; i<processList.length; i++){
        if (processList[i].length>0)
            allocatedMemory += Number(memList[i].memSize);
    }

    return allocatedMemory/totalMemSize;
    
}

function merge2DArrays(arr1, arr2) {
    const maxLength = Math.max(arr1.length, arr2.length);
    const merged = [];
  
    for (let i = 0; i < maxLength; i++) {
      const row1 = arr1[i] || []; // If undefined, use empty array
      const row2 = arr2[i] || [];
      merged.push(row1.concat(row2));
    }
  
    return merged;
}

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

            const firstFitPlacement = firstFit(jobList, memList);
            const worstFitPlacement = worstFit(jobList, memList);
            const bestFitPlacement = bestFit(jobList, memList);

            let firstFitTime = 0;
            let worstFitTime = 0;
            let bestFitTime = 0;
            
            function execute() {
                if (firstFitPlacement.some((process) => process.length > 0) || worstFitPlacement.some((process) => process.length > 0) || bestFitPlacement.some((process) => process.length > 0)) {
                    console.log("_____________________________________________________________________________________________________________________________________________________");
                    console.log("FIRST-FIT PLACEMENT");
                    if (firstFitPlacement.some((process) => process.length > 0))
                        firstFitTime++;

                    for (let i = 0; i < firstFitPlacement.length; i++) {
                        if (firstFitPlacement[i].length > 0) {
                            if (firstFitPlacement[i][0].time <= 0) {
                                firstFitPlacement[i].shift();
                            } else {
                                firstFitPlacement[i][0].time--;
                            }
                        }
                    }

                    const tableData = firstFitPlacement.map((queue, index) => {
                        const row = {
                            "memory block": index + 1,
                            "memory size": Number(memList[index].memSize),
                            "active": queue[0] ? { job: queue[0].job, time: queue[0].time } : null,
                            "job size 1": queue[0]?.jobSize ?? null
                        };
                    
                        for (let j = 1; j < queue.length; j++) {
                            const job = queue[j];
                    
                            // Set queue info column (job + time)
                            row[`queue ${j}`] = job ? { job: job.job, time: job.time } : null;
                    
                            // Set corresponding job size column
                            row[`job size ${j+1}`] = job?.jobSize ?? null;
                        }
                    
                        return row;
                    });

                    console.table(tableData);
                    console.log("Memory Utilization of First-Fit: " + memUtil(memList, firstFitPlacement)*100+"%");
                    console.log("Internal Fragmentation of First-Fit: " + internalFrag(memList, firstFitPlacement));
                    memUtil(memList, firstFitPlacement);

                    /*WORST FIT MEMORY PLACEMENT*/
                    console.log("_____________________________________________________________________________________________________________________________________________________");
                    console.log("WORST-FIT PLACEMENT");
                    if (worstFitPlacement.some((process) => process.length > 0))
                        worstFitTime++;

                    for (let i = 0; i < worstFitPlacement.length; i++) {
                        if (worstFitPlacement[i].length > 0) {
                            if (worstFitPlacement[i][0].time <= 0) {
                                worstFitPlacement[i].shift();
                            } else {
                                worstFitPlacement[i][0].time--;
                            }
                        }
                    }

                    const tableData1 = worstFitPlacement.map((queue, index) => {
                        const row = {
                            "memory block": index + 1,
                            "memory size": Number(memList[index].memSize),
                            "active": queue[0] ? { job: queue[0].job, time: queue[0].time } : null,
                            "job size 1": queue[0]?.jobSize ?? null
                        };
                    
                        for (let j = 1; j < queue.length; j++) {
                            const job = queue[j];
                    
                            // Set queue info column (job + time)
                            row[`queue ${j}`] = job ? { job: job.job, time: job.time } : null;
                    
                            // Set corresponding job size column
                            row[`job size ${j+1}`] = job?.jobSize ?? null;
                        }
                    
                        return row;
                    });

                    console.table(tableData1);
                    console.log("Memory Utilization of Worst-Fit: " + memUtil(memList, worstFitPlacement)*100+"%");
                    console.log("Internal Fragmentation of Worst-Fit: " + internalFrag(memList, worstFitPlacement));
                    memUtil(memList, worstFitPlacement);

                    /* BEST-FIT MEMORY PLACEMENT */
                    console.log("_____________________________________________________________________________________________________________________________________________________");
                    console.log("BEST-FIT PLACEMENT");
                    if (bestFitPlacement.some((process) => process.length > 0))
                        bestFitTime++;

                    for (let i = 0; i < bestFitPlacement.length; i++) {
                        if (bestFitPlacement[i].length > 0) {
                            if (bestFitPlacement[i][0].time <= 0) {
                                bestFitPlacement[i].shift();
                            } else {
                                bestFitPlacement[i][0].time--;
                            }
                        }
                    }

                    const tableData2 = bestFitPlacement.map((queue, index) => {
                        const row = {
                            "memory block": index + 1,
                            "memory size": Number(memList[index].memSize),
                            "active": queue[0] ? { job: queue[0].job, time: queue[0].time } : null,
                            "job size 1": queue[0]?.jobSize ?? null
                        };
                    
                        for (let j = 1; j < queue.length; j++) {
                            const job = queue[j];
                    
                            // Set queue info column (job + time)
                            row[`queue ${j}`] = job ? { job: job.job, time: job.time } : null;
                    
                            // Set corresponding job size column
                            row[`job size ${j+1}`] = job?.jobSize ?? null;
                        }
                    
                        return row;
                    });

                    console.table(tableData2);
                    console.log("Memory Utilization of Best-Fit: " + memUtil(memList, bestFitPlacement)*100+"%");
                    console.log("Internal Fragmentation of Best-Fit: " + internalFrag(memList, bestFitPlacement));
                    memUtil(memList, bestFitPlacement);

                    readline.question('-----------------------Press Enter to Continue-----------------------', () => {
                        execute();
                    });
                } else {
                    readline.close();
                }
            }

            execute();
        });
    });
}
  

//[{job: Number, time: number}]

