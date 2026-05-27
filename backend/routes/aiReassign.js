const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const TeamMember = require('../models/TeamMember');
const ReassignmentLog = require('../models/ReassignmentLog');

/**
 * AI Reassignment Logic:
 * Finds the best replacement for a member on leave.
 */
async function reassignTasksFrom(memberId) {
    const results = { reassigned: 0, atRisk: 0, logs: [] };

    try {
        // 1. Find all active tasks for the member
        const tasksToShift = await Task.find({ 
            assignedTo: memberId, 
            status: { $in: ['todo', 'ongoing'] } 
        });

        if (tasksToShift.length === 0) return results;

        // 2. Get all available members (Status = 'Active')
        const allMembers = await TeamMember.find({ 
            _id: { $ne: memberId },
            status: 'Active' 
        });

        const originalMember = await TeamMember.findById(memberId);

        for (const task of tasksToShift) {
            let bestReplacement = null;
            let highestScore = -1;

            for (const candidate of allMembers) {
                let score = 100;

                // A. Skill Match (Qualities)
                const taskQualities = task.requiredQualities || [];
                const matchedQualities = taskQualities.filter(q => candidate.qualities.includes(q));
                score += (matchedQualities.length * 20);

                // B. Workload (Penalty)
                const currentLoad = candidate.currentTaskCount || 0;
                const maxLoad = candidate.maxTasks || 5;
                if (currentLoad >= maxLoad) score -= 50; // Overloaded
                else score -= (currentLoad * 5); // Preferred lighter load

                // C. Team Consistency
                if (candidate.team === originalMember.team) score += 15;

                if (score > highestScore && score > 0) {
                    highestScore = score;
                    bestReplacement = candidate;
                }
            }

            if (bestReplacement && highestScore > 0) {
                // Update Task
                task.assignedTo = bestReplacement._id;
                task.isAtRisk = false;
                await task.save();

                // Update Counts
                bestReplacement.currentTaskCount = (bestReplacement.currentTaskCount || 0) + 1;
                await bestReplacement.save();

                originalMember.currentTaskCount = Math.max(0, (originalMember.currentTaskCount || 0) - 1);
                await originalMember.save();

                // Log
                const log = new ReassignmentLog({
                    taskId: task._id,
                    taskTitle: task.title,
                    fromUserId: memberId,
                    toUserId: bestReplacement._id,
                    reason: `AI matched ${bestReplacement.name} (${highestScore} score)`
                });
                await log.save();
                results.reassigned++;
            } else {
                // Mark At Risk
                task.isAtRisk = true;
                await task.save();
                results.atRisk++;
            }
        }
    } catch (err) {
        console.error('Reassignment Error:', err);
    }

    return results;
}

// ─── POST /api/hr/trigger-reassignment ─────────────────────────────────────
router.post('/reassign/:memberId', async (req, res) => {
    const results = await reassignTasksFrom(req.params.memberId);
    res.json(results);
});

module.exports = { router, reassignTasksFrom };
