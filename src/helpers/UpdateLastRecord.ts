import { LastFileProcess } from "../Entities/LastFileProcess"; 
export const updateLastFileProcess = async () => {
  try {
    let lastFileProcess = await LastFileProcess.createQueryBuilder("lastFileProcess")
    .select()
    .getOne();

    if (lastFileProcess) {
      // Update the existing record
      lastFileProcess.createdAt = new Date();
      await lastFileProcess.save();
    } else {
      // Insert a new record
      lastFileProcess = LastFileProcess.create({ createdAt: new Date() });
      await lastFileProcess.save();
    }
  } catch (error) {
    console.error("Error updating LastFileProcess:", error);
  }
};
