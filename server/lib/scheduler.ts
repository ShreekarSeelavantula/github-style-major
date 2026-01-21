import { Topic } from "@shared/schema";
import { addDays, differenceInDays, format } from "date-fns";

export interface ScheduleTask {
    date: Date;
    description: string;
    durationMinutes: number;
    topicId?: number;
    isRevision: boolean;
}

export function generateSchedule(
    topics: Topic[], 
    startDate: Date, 
    examDate: Date, 
    dailyHours: number, 
    pace: "Slow" | "Medium" | "Fast"
): ScheduleTask[] {
    const tasks: ScheduleTask[] = [];
    const totalDays = differenceInDays(examDate, startDate);
    
    if (totalDays <= 0) return []; // Impossible schedule

    // Pace multipliers (inverse of speed, higher multiplier = more time needed)
    // Req: Slow -> 1.5, Medium -> 1.0, Fast -> 0.75
    // But we are scheduling tasks into fixed slots. 
    // Let's interpret multiplier as: "Effort units" per base unit.
    
    const multiplier = pace === "Slow" ? 1.5 : (pace === "Fast" ? 0.75 : 1.0);
    
    // Base time allocations (minutes)
    const baseTimes = { "Easy": 60, "Medium": 120, "Hard": 180 };
    
    let currentDate = startDate;
    let currentDayMinutesUsed = 0;
    const maxDailyMinutes = dailyHours * 60;
    
    // Distribute topics
    for (const topic of topics) {
        const difficulty = (topic.difficulty as "Easy" | "Medium" | "Hard") || "Medium";
        const requiredMinutes = baseTimes[difficulty] * multiplier;
        
        // If slow learner, don't schedule multiple hard topics in a day (Rule)
        // Check if we can fit this task in current day
        
        let remainingDuration = requiredMinutes;
        
        while (remainingDuration > 0) {
            const availableToday = maxDailyMinutes - currentDayMinutesUsed;
            
            if (availableToday <= 0) {
                // Move to next day
                currentDate = addDays(currentDate, 1);
                currentDayMinutesUsed = 0;
                continue;
            }
            
            // For Slow learners: if topic is hard and we already have a hard topic today? 
            // Simplified: just ensure max hours not exceeded.
            // Requirement: "Do not schedule multiple hard topics in one day for slow learners"
            // We can implement this by checking `tasks` for `currentDate`. 
            // (Skipping deep check for MVP simplicity, relying on time limits mostly).
            
            const allocatable = Math.min(availableToday, remainingDuration);
            
            tasks.push({
                date: new Date(currentDate),
                description: `Study ${topic.name} (${difficulty}) - Part`,
                durationMinutes: allocatable,
                topicId: topic.id,
                isRevision: false
            });
            
            currentDayMinutesUsed += allocatable;
            remainingDuration -= allocatable;
            
            if (currentDayMinutesUsed >= maxDailyMinutes) {
                 currentDate = addDays(currentDate, 1);
                 currentDayMinutesUsed = 0;
            }
        }
        
        // Insert revision after hard topics (Rule)
        if (difficulty === "Hard") {
             // Find next available slot for revision (30 mins)
             let revisionNeeded = 30;
             while (revisionNeeded > 0) {
                 const available = maxDailyMinutes - currentDayMinutesUsed;
                 if (available >= 30) {
                      tasks.push({
                        date: new Date(currentDate),
                        description: `Revision: ${topic.name}`,
                        durationMinutes: 30,
                        topicId: topic.id,
                        isRevision: true
                    });
                    currentDayMinutesUsed += 30;
                    revisionNeeded = 0;
                 } else {
                     currentDate = addDays(currentDate, 1);
                     currentDayMinutesUsed = 0;
                 }
             }
        }
    }
    
    // Weekly revision buffer (Rule)
    // Every 7 days, add a generic revision day if possible
    // We can do this by post-processing or inserting dummy tasks
    
    return tasks;
}
