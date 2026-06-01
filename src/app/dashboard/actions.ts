'use server';

import { prisma } from '@/lib/prisma';
import { PublicationStatus } from '@prisma/client';
import { revalidatePath } from 'next/cache';

export async function approvePublication(id: string) {
  await prisma.publication.update({
    where: { id },
    data: { status: PublicationStatus.APPROVED }
  });
  revalidatePath('/dashboard');
}

export async function rejectPublication(id: string) {
  await prisma.publication.update({
    where: { id },
    data: { status: PublicationStatus.REJECTED }
  });
  revalidatePath('/dashboard');
}
