'use strict';

exports.isStar = true;
exports.runParallel = runParallel;

function createAsyncJobs(jobs, timeout) {
    return jobs.map(job => () => new Promise((resolve, reject) => {
        job().then(resolve, reject);
        setTimeout(() => reject(new Error('Promise timeout')), timeout);
    }));
}

/** Функция паралелльно запускает указанное число промисов
 * @param {Array} jobs – функции, которые возвращают промисы
 * @param {Number} parallelNum - число одновременно исполняющихся промисов
 * @param {Number} timeout - таймаут работы промиса
 * @returns {Promise}
 */
function runParallel(jobs, parallelNum, timeout = 1000) {
    return new Promise(resolve => {
        if (jobs.length === 0) {
            resolve([]);
        }

        let curIndex = 0;
        let completeJobsCount = 0;
        const result = [];
        const asyncJobs = createAsyncJobs(jobs, timeout);

        for (let i = 0; i < parallelNum; i++) {
            runJob(asyncJobs[i]);
        }

        function runJob(job) {
            const index = curIndex++;
            let jobDisposer = jobResult => disposeJob(jobResult, index);

            job()
                .then(jobDisposer)
                .catch(jobDisposer);
        }

        function disposeJob(jobResult, index) {
            result[index] = jobResult;

            completeJobsCount++;

            if (completeJobsCount === asyncJobs.length) {
                resolve(result);
            }

            if (curIndex < asyncJobs.length) {
                runJob(asyncJobs[curIndex]);
            }
        }
    });
}
