"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// --- LECTURE (READ) ---
export async function getHalalFlowData() {
  // 1. Settings (ou création par défaut si vide)
  let settings = await prisma.userSettings.findFirst({ where: { id: 1 } });
  if (!settings) {
    settings = await prisma.userSettings.create({
      data: { name: "Utilisateur", balance: 0, monthlyIncome: 0, monthlyExpenses: 0 }
    });
  }

  // 2. Récupération parallèle pour performance
  const [transactions, goals, assets, futureOperations] = await Promise.all([
    prisma.transaction.findMany({ orderBy: { date: 'desc' } }),
    prisma.goal.findMany(),
    prisma.asset.findMany(),
    prisma.futureOperation.findMany()
  ]);

  // 3. Conversion des types Prisma (Decimal/Date) vers types JS pour le Frontend
  return {
    user: { name: settings.name },
    finance: {
      balance: Number(settings.balance),
      income: Number(settings.monthlyIncome),
      expenses: Number(settings.monthlyExpenses),
      lastBudgetCheck: settings.lastBudgetCheck
    },
    transactions: transactions.map(t => ({ ...t, amount: Number(t.amount), date: t.date.toISOString() })),
    goals: goals.map(g => ({ ...g, target: Number(g.targetAmount) })),
    assets: assets.map(a => ({ ...a, value: Number(a.value) })),
    futureOperations: futureOperations.map(op => ({ ...op, amount: Number(op.amount), date: op.date.toISOString() }))
  };
}

// --- ÉCRITURE (WRITE) ---

export async function updateSettings(data: any) {
  const updateData: any = {};
  if (data.name) updateData.name = data.name;
  if (data.balance !== undefined) updateData.balance = data.balance;
  if (data.income !== undefined) updateData.monthlyIncome = data.income;
  if (data.expenses !== undefined) updateData.monthlyExpenses = data.expenses;
  if (data.lastCheck) updateData.lastBudgetCheck = data.lastCheck;

  await prisma.userSettings.update({ where: { id: 1 }, data: updateData });
  revalidatePath("/");
}

export async function addTransactionAction(txData: any) {
  // 1. Créer la transaction
  await prisma.transaction.create({
    data: {
      type: txData.type,
      amount: txData.amount,
      label: txData.label,
      date: new Date(),
      relatedGoalId: txData.relatedGoalId,
      relatedAssetId: txData.relatedAssetId,
      relatedOpId: txData.relatedOpId
    }
  });

  // 2. Mettre à jour le solde
  const settings = await prisma.userSettings.findFirst({ where: { id: 1 } });
  if (settings) {
    const current = Number(settings.balance);
    const amount = Number(txData.amount);
    const newVal = txData.type === 'in' ? current + amount : current - amount;
    await prisma.userSettings.update({ where: { id: 1 }, data: { balance: newVal } });
  }

  // 3. Mise à jour des status liés (Logic métier)
  if (txData.relatedGoalId) await prisma.goal.update({ where: { id: txData.relatedGoalId }, data: { status: 'completed' } });
  if (txData.relatedAssetId) await prisma.asset.update({ where: { id: txData.relatedAssetId }, data: { status: 'sold' } });
  if (txData.relatedOpId) await prisma.futureOperation.update({ where: { id: txData.relatedOpId }, data: { received: true } });

  revalidatePath("/");
}

export async function deleteTransactionAction(id: string) {
  const tx = await prisma.transaction.findUnique({ where: { id } });
  if (!tx) return;

  // Rollback Solde
  const settings = await prisma.userSettings.findFirst({ where: { id: 1 } });
  if (settings) {
    const current = Number(settings.balance);
    const amount = Number(tx.amount);
    const newVal = tx.type === 'in' ? current - amount : current + amount;
    await prisma.userSettings.update({ where: { id: 1 }, data: { balance: newVal } });
  }

  // Rollback Status
  if (tx.relatedGoalId) await prisma.goal.update({ where: { id: tx.relatedGoalId }, data: { status: 'active' } });
  if (tx.relatedAssetId) await prisma.asset.update({ where: { id: tx.relatedAssetId }, data: { status: 'active' } });
  if (tx.relatedOpId) await prisma.futureOperation.update({ where: { id: tx.relatedOpId }, data: { received: false } });

  await prisma.transaction.delete({ where: { id } });
  revalidatePath("/");
}

export async function upsertAssetAction(asset: any) {
  if (asset.id && asset.id.length > 10) {
    await prisma.asset.update({ where: { id: asset.id }, data: { name: asset.name, value: asset.value, category: asset.category } });
  } else {
    await prisma.asset.create({ data: { name: asset.name, value: asset.value, category: asset.category, status: 'active' } });
  }
  revalidatePath("/");
}

export async function deleteAssetAction(id: string) {
  await prisma.asset.delete({ where: { id } });
  revalidatePath("/");
}

export async function upsertGoalAction(goal: any) {
  if (goal.id && goal.id.length > 10) {
    await prisma.goal.update({ where: { id: goal.id }, data: { name: goal.name, targetAmount: goal.target, color: goal.color, iconKey: goal.iconKey } });
  } else {
    await prisma.goal.create({ data: { name: goal.name, targetAmount: goal.target, color: goal.color, iconKey: goal.iconKey, status: 'active' } });
  }
  revalidatePath("/");
}

export async function deleteGoalAction(id: string) {
  await prisma.goal.delete({ where: { id } });
  revalidatePath("/");
}

export async function addFutureOpAction(op: any) {
  await prisma.futureOperation.create({
    data: { label: op.label, amount: op.amount, type: op.type, date: new Date(op.date), received: false }
  });
  revalidatePath("/");
}

export async function deleteFutureOpAction(id: string) {
  await prisma.futureOperation.delete({ where: { id } });
  revalidatePath("/");
}
