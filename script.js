document.addEventListener('DOMContentLoaded', function() {
    const processInputs = document.getElementById('process-inputs');
    const addProcessBtn = document.getElementById('add-process');
    const generateRandomBtn = document.getElementById('generate-random');
    const clearAllBtn = document.getElementById('clear-all');
    const algorithmSelect = document.getElementById('algorithm-select');
    const timeQuantumContainer = document.getElementById('time-quantum-container');
    const simulateBtn = document.getElementById('simulate-btn');
    const compareBtn = document.getElementById('compare-btn');
    const ganttChart = document.getElementById('gantt-chart');
    const resultsTable = document.getElementById('results-table');
    const comparisonResults = document.getElementById('comparison-results');
    const comparisonTable = document.getElementById('comparison-table').querySelector('tbody');


    addProcessInput();

    addProcessBtn.addEventListener('click', addProcessInput);
    generateRandomBtn.addEventListener('click', generateRandomProcesses);
    clearAllBtn.addEventListener('click', clearAllProcesses);
    algorithmSelect.addEventListener('change', toggleTimeQuantum);
    simulateBtn.addEventListener('click', simulate);
    compareBtn.addEventListener('click', compareAlgorithms);


    function addProcessInput() {
        const div = document.createElement('div');
        div.className = 'process-input';
        div.innerHTML = `
            <input type="number" class="pid" placeholder="Process ID" min="1">
            <input type="number" class="arrival-time" placeholder="Arrival Time" min="0">
            <input type="number" class="burst-time" placeholder="Burst Time" min="1">
            <input type="number" class="priority" placeholder="Priority (optional)">
            <button class="remove-btn">×</button>
        `;
        processInputs.appendChild(div);
        
        div.querySelector('.remove-btn').addEventListener('click', function() {
            if (processInputs.children.length > 1) {
                processInputs.removeChild(div);
            } else {
                alert('You need at least one process input');
            }
        });
    }

    function generateRandomProcesses() {
        clearAllProcesses();
        const processCount = Math.floor(Math.random() * 5) + 3; 
        
        for (let i = 1; i <= processCount; i++) {
            addProcessInput();
            const inputs = processInputs.children[i-1].querySelectorAll('input');
            inputs[0].value = i;
            inputs[1].value = Math.floor(Math.random() * 5);
            inputs[2].value = Math.floor(Math.random() * 10) + 1;
            inputs[3].value = Math.floor(Math.random() * 10) + 1;
        }
    }

    function clearAllProcesses() {
        processInputs.innerHTML = '';
        addProcessInput();
        clearResults();
    }

    function toggleTimeQuantum() {
        timeQuantumContainer.style.display = algorithmSelect.value === 'rr' ? 'block' : 'none';
    }

    function getProcesses() {
        const processes = [];
        const inputs = processInputs.querySelectorAll('.process-input');
        
        for (let i = 0; i < inputs.length; i++) {
            const pid = inputs[i].querySelector('.pid').value;
            const arrivalTime = inputs[i].querySelector('.arrival-time').value;
            const burstTime = inputs[i].querySelector('.burst-time').value;
            const priority = inputs[i].querySelector('.priority').value || 0;
            
            if (!pid || !arrivalTime || !burstTime) {
                alert('Please fill all required fields for all processes');
                return null;
            }
            
            processes.push({
                pid: parseInt(pid),
                arrivalTime: parseInt(arrivalTime),
                burstTime: parseInt(burstTime),
                priority: parseInt(priority),
                remainingTime: parseInt(burstTime)
            });
        }
        return processes;
    }

    function simulate() {
        const processes = getProcesses();
        if (!processes) return;
        
        const algorithm = algorithmSelect.value;
        const timeQuantum = algorithm === 'rr' ? parseInt(document.getElementById('time-quantum').value) : null;
        
        let result;
        try {
            switch(algorithm) {
                case 'fcfs': result = fcfs(processes); break;
                case 'sjf': result = sjf(processes); break;
                case 'srtf': result = srtf(processes); break;
                case 'rr': 
                    if (!timeQuantum || timeQuantum < 1) {
                        alert('Please enter a valid time quantum (≥1)');
                        return;
                    }
                    result = roundRobin(processes, timeQuantum); 
                    break;
                case 'priority': result = priorityScheduling(processes, false); break;
                case 'priority_preemptive': result = priorityScheduling(processes, true); break;
                default: alert('Invalid algorithm selected'); return;
            }
            displayResults(result, algorithm);
        } catch (error) {
            alert(`Error during simulation: ${error.message}`);
        }
    }

    function compareAlgorithms() {
        const processes = getProcesses();
        if (!processes) return;
        
        const algorithms = [
            {id: 'fcfs', name: 'FCFS'},
            {id: 'sjf', name: 'SJF'},
            {id: 'srtf', name: 'SRTF'},
            {id: 'rr', name: 'Round Robin'},
            {id: 'priority', name: 'Priority'},
            {id: 'priority_preemptive', name: 'Priority (Preemptive)'}
        ];
        
        const timeQuantum = parseInt(document.getElementById('time-quantum').value) || 2;
        comparisonTable.innerHTML = '';
        
        algorithms.forEach(alg => {
            try {
                let result;
                switch(alg.id) {
                    case 'fcfs': result = fcfs([...processes]); break;
                    case 'sjf': result = sjf([...processes]); break;
                    case 'srtf': result = srtf([...processes]); break;
                    case 'rr': result = roundRobin([...processes], timeQuantum); break;
                    case 'priority': result = priorityScheduling([...processes], false); break;
                    case 'priority_preemptive': result = priorityScheduling([...processes], true); break;
                }
                
                const avgWaitingTime = calculateAverage(result.processes.map(p => p.waitingTime));
                const avgTurnaroundTime = calculateAverage(result.processes.map(p => p.turnaroundTime));
                const throughput = result.processes.length / result.totalTime;
                
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${alg.name}</td>
                    <td>${avgWaitingTime.toFixed(2)}</td>
                    <td>${avgTurnaroundTime.toFixed(2)}</td>
                    <td>${throughput.toFixed(4)}</td>
                `;
                comparisonTable.appendChild(row);
            } catch (error) {
                console.error(`Error in ${alg.name}:`, error);
            }
        });
        comparisonResults.style.display = 'block';
    }

    function displayResults(result, algorithm) {
        clearResults();
        displayGanttChart(result.ganttChart);
        displayResultsTable(result.processes, result.totalTime, algorithm);
    }

    function displayGanttChart(ganttData) {
        ganttChart.innerHTML = '';
        
        ganttData.forEach(item => {
            const block = document.createElement('div');
            block.className = 'gantt-block';
            block.style.flex = item.duration;
            block.textContent = `P${item.processId}`;
            ganttChart.appendChild(block);
            
            const time = document.createElement('div');
            time.className = 'gantt-time';
            time.textContent = item.startTime;
            ganttChart.appendChild(time);
        });
        
        if (ganttData.length > 0) {
            const finalTime = document.createElement('div');
            finalTime.className = 'gantt-time';
            finalTime.textContent = ganttData[ganttData.length - 1].startTime + ganttData[ganttData.length - 1].duration;
            ganttChart.appendChild(finalTime);
        }
    }

    function displayResultsTable(processes, totalTime, algorithm) {
        const avgWaitingTime = calculateAverage(processes.map(p => p.waitingTime));
        const avgTurnaroundTime = calculateAverage(processes.map(p => p.turnaroundTime));
        const throughput = processes.length / totalTime;
        
        let tableHTML = `
            <table>
                <thead>
                    <tr>
                        <th>Process ID</th>
                        <th>Arrival Time</th>
                        <th>Burst Time</th>
                        ${algorithm.includes('priority') ? '<th>Priority</th>' : ''}
                        <th>Completion Time</th>
                        <th>Turnaround Time</th>
                        <th>Waiting Time</th>
                    </tr>
                </thead>
                <tbody>
        `;
        
        processes.forEach(p => {
            tableHTML += `
                <tr>
                    <td>P${p.pid}</td>
                    <td>${p.arrivalTime}</td>
                    <td>${p.burstTime}</td>
                    ${algorithm.includes('priority') ? `<td>${p.priority}</td>` : ''}
                    <td>${p.completionTime}</td>
                    <td>${p.turnaroundTime}</td>
                    <td>${p.waitingTime}</td>
                </tr>
            `;
        });
        
        tableHTML += `
                </tbody>
                <tfoot>
                    <tr>
                        <td colspan="${algorithm.includes('priority') ? '5' : '4'}"><strong>Average</strong></td>
                        <td><strong>${avgTurnaroundTime.toFixed(2)}</strong></td>
                        <td><strong>${avgWaitingTime.toFixed(2)}</strong></td>
                    </tr>
                    <tr>
                        <td colspan="${algorithm.includes('priority') ? '5' : '4'}"><strong>Throughput</strong></td>
                        <td colspan="2"><strong>${throughput.toFixed(4)} processes per unit time</strong></td>
                    </tr>
                </tfoot>
            </table>
        `;
        
        resultsTable.innerHTML = tableHTML;
    }

    function clearResults() {
        ganttChart.innerHTML = '';
        resultsTable.innerHTML = '';
        comparisonResults.style.display = 'none';
    }

    function calculateAverage(numbers) {
        return numbers.length ? numbers.reduce((a, b) => a + b, 0) / numbers.length : 0;
    }

    // Scheduling algo
    function fcfs(processes) {
        processes.sort((a, b) => a.arrivalTime - b.arrivalTime);
        let currentTime = 0;
        const ganttChart = [];
        
        for (const p of processes) {
            currentTime = Math.max(currentTime, p.arrivalTime);
            ganttChart.push({processId: p.pid, startTime: currentTime, duration: p.burstTime});
            
            p.completionTime = currentTime + p.burstTime;
            p.turnaroundTime = p.completionTime - p.arrivalTime;
            p.waitingTime = p.turnaroundTime - p.burstTime;
            currentTime = p.completionTime;
        }
        return {processes, ganttChart, totalTime: currentTime};
    }

    function sjf(processes) {
        processes.sort((a, b) => a.arrivalTime - b.arrivalTime);
        let currentTime = 0;
        const ganttChart = [];
        const readyQueue = [];
        let i = 0;
        
        while (i < processes.length || readyQueue.length) {
            while (i < processes.length && processes[i].arrivalTime <= currentTime) {
                readyQueue.push(processes[i++]);
            }
            
            if (!readyQueue.length) {
                currentTime = processes[i].arrivalTime;
                continue;
            }
            
            readyQueue.sort((a, b) => a.burstTime - b.burstTime);
            const p = readyQueue.shift();
            
            ganttChart.push({processId: p.pid, startTime: currentTime, duration: p.burstTime});
            p.completionTime = currentTime + p.burstTime;
            p.turnaroundTime = p.completionTime - p.arrivalTime;
            p.waitingTime = p.turnaroundTime - p.burstTime;
            currentTime = p.completionTime;
        }
        return {processes, ganttChart, totalTime: currentTime};
    }

    function srtf(processes) {
        processes.sort((a, b) => a.arrivalTime - b.arrivalTime);
        let currentTime = 0;
        const ganttChart = [];
        const readyQueue = [];
        let i = 0;
        let currentProcess = null;
        let lastProcessId = null;
        
        while (i < processes.length || readyQueue.length || currentProcess) {
            while (i < processes.length && processes[i].arrivalTime <= currentTime) {
                readyQueue.push({...processes[i++]});
            }
            
            readyQueue.sort((a, b) => a.remainingTime - b.remainingTime);
            const nextProcess = readyQueue[0];
            
            if (!currentProcess && nextProcess) {
                currentProcess = readyQueue.shift();
            } else if (currentProcess && nextProcess && nextProcess.remainingTime < currentProcess.remainingTime) {
                readyQueue.push(currentProcess);
                currentProcess = readyQueue.shift();
            }
            
            if (!currentProcess) {
                currentTime = processes[i].arrivalTime;
                continue;
            }
            
            let timeSlice = 1;
            if (i < processes.length) timeSlice = Math.min(timeSlice, processes[i].arrivalTime - currentTime);
            timeSlice = Math.min(timeSlice, currentProcess.remainingTime);
            
            if (lastProcessId !== currentProcess.pid) {
                ganttChart.push({processId: currentProcess.pid, startTime: currentTime, duration: timeSlice});
                lastProcessId = currentProcess.pid;
            } else {
                ganttChart[ganttChart.length - 1].duration += timeSlice;
            }
            
            currentProcess.remainingTime -= timeSlice;
            currentTime += timeSlice;
            
            if (currentProcess.remainingTime === 0) {
                const p = processes.find(proc => proc.pid === currentProcess.pid);
                p.completionTime = currentTime;
                p.turnaroundTime = currentTime - p.arrivalTime;
                p.waitingTime = p.turnaroundTime - p.burstTime;
                currentProcess = null;
            }
        }
        return {processes, ganttChart, totalTime: currentTime};
    }

    function roundRobin(processes, timeQuantum) {
        processes.sort((a, b) => a.arrivalTime - b.arrivalTime);
        let currentTime = 0;
        const ganttChart = [];
        const readyQueue = [];
        let i = 0;
        const remainingProcesses = processes.map(p => ({...p}));
        
        while (i < remainingProcesses.length || readyQueue.length) {
            while (i < remainingProcesses.length && remainingProcesses[i].arrivalTime <= currentTime) {
                readyQueue.push(remainingProcesses[i++]);
            }
            
            if (!readyQueue.length) {
                currentTime = remainingProcesses[i].arrivalTime;
                continue;
            }
            
            const p = readyQueue.shift();
            const execTime = Math.min(timeQuantum, p.remainingTime);
            
            ganttChart.push({processId: p.pid, startTime: currentTime, duration: execTime});
            p.remainingTime -= execTime;
            currentTime += execTime;
            
            while (i < remainingProcesses.length && remainingProcesses[i].arrivalTime <= currentTime) {
                readyQueue.push(remainingProcesses[i++]);
            }
            
            if (p.remainingTime > 0) {
                readyQueue.push(p);
            } else {
                const original = processes.find(proc => proc.pid === p.pid);
                original.completionTime = currentTime;
                original.turnaroundTime = currentTime - original.arrivalTime;
                original.waitingTime = original.turnaroundTime - original.burstTime;
            }
        }
        return {processes, ganttChart, totalTime: currentTime};
    }

    function priorityScheduling(processes, preemptive) {
        processes.sort((a, b) => a.arrivalTime - b.arrivalTime);
        let currentTime = 0;
        const ganttChart = [];
        const readyQueue = [];
        let i = 0;
        let currentProcess = null;
        let lastProcessId = null;
        const remainingProcesses = processes.map(p => ({...p}));
        
        while (i < remainingProcesses.length || readyQueue.length || currentProcess) {
            while (i < remainingProcesses.length && remainingProcesses[i].arrivalTime <= currentTime) {
                readyQueue.push(remainingProcesses[i++]);
            }
            
            readyQueue.sort((a, b) => a.priority - b.priority);
            const nextProcess = readyQueue[0];
            
            if (!currentProcess && nextProcess) {
                currentProcess = readyQueue.shift();
            } else if (preemptive && currentProcess && nextProcess && nextProcess.priority < currentProcess.priority) {
                readyQueue.push(currentProcess);
                currentProcess = readyQueue.shift();
            }
            
            if (!currentProcess) {
                currentTime = remainingProcesses[i].arrivalTime;
                continue;
            }
            
            let timeSlice = preemptive ? 1 : currentProcess.remainingTime;
            if (i < remainingProcesses.length) timeSlice = Math.min(timeSlice, remainingProcesses[i].arrivalTime - currentTime);
            timeSlice = Math.min(timeSlice, currentProcess.remainingTime);
            
            if (lastProcessId !== currentProcess.pid) {
                ganttChart.push({processId: currentProcess.pid, startTime: currentTime, duration: timeSlice});
                lastProcessId = currentProcess.pid;
            } else {
                ganttChart[ganttChart.length - 1].duration += timeSlice;
            }
            
            currentProcess.remainingTime -= timeSlice;
            currentTime += timeSlice;
            
            if (currentProcess.remainingTime === 0) {
                const p = processes.find(proc => proc.pid === currentProcess.pid);
                p.completionTime = currentTime;
                p.turnaroundTime = currentTime - p.arrivalTime;
                p.waitingTime = p.turnaroundTime - p.burstTime;
                currentProcess = null;
            }
        }
        return {processes, ganttChart, totalTime: currentTime};
    }
});