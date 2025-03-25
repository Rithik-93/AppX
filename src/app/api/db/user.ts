'use server'

import { Domain, Zone } from "@prisma/client";
import prisma from "../../../../prisma/src";
import { Category, ExamData, Gender } from "@/app/schema/types";

export async function findUser(rollNumber: string, domain: Domain, examId: string) {
  try {
    console.log('Searching for user with params:', { 
      rollNumber, 
      domain, 
      examId 
    });
    
    const user = await prisma.user.findFirst({
      where: {
        examAttempts: {
          some: {
            rollNumber,
            domain,
            examId,
          },  
        },
      },
    });

    console.log('Query result:', user);

    if (!user) {
      console.log('No user found with these parameters');
      return null;
    }
  
    console.log('Found user', user);
    return user;
  } catch(e) {
    // console.error('Error finding user:', e);
    console.log(e);
    return null;
  }
}

export async function createUser(
  examData: ExamData,
  category: Category,
  zone: Zone,
  gender: Gender,
  domain: Domain,
  phone: string
) {
  try {
    console.log('Creating new user with data:', { 
      name: examData.candidateInfo["Applicant Name"],
      category,
      zone,
      gender,
      domain,
      phone 
    });
    
    const user = await prisma.user.create({
      data: {
        name: examData.candidateInfo["Applicant Name"],
        category,
        zone,
        gender,
        domain: domain as Domain,
        phone
      },
    });
    
    console.log('User created successfully:', user);
    return user;
  } catch(e) {
    // console.error('Error creating user:', e);
    console.log(e);
    return null; // Return null instead of undefined
  }
}
