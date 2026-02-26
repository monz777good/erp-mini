// prisma/seed.ts
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // 1) 관리자/영업 샘플 유저(없으면 생성)
  const admin = await prisma.user.upsert({
    where: { phone: "01000000000" },
    update: {},
    create: {
      name: "관리자",
      phone: "01000000000",
      role: "ADMIN",
    },
  });

  const sales = await prisma.user.upsert({
    where: { phone: "01022222222" },
    update: {},
    create: {
      name: "영업사원",
      phone: "01022222222",
      role: "SALES",
    },
  });

  // 2) 샘플 품목(없으면 생성)
  const item = await prisma.item.upsert({
    where: { name: "테스트 품목" },
    update: {},
    create: { name: "테스트 품목" },
  });

  // 3) 샘플 주문 1개 생성
  // ⚠️ 여기서 phone / mobile 같은 "없는 필드" 절대 넣지 말기
  // ✅ receiverPhone / receiverMobile 로 넣기
  await prisma.order.create({
    data: {
      userId: sales.id,
      itemId: item.id,
      quantity: 1,
      status: "REQUESTED",
      note: "seed 테스트",

      receiverName: "이현택",
      receiverAddr: "경기도 시흥시 (테스트 주소)",
      receiverPhone: "01023833691",
      receiverMobile: "01023833691",
      message: "취급주의",
      boxQty: 1,
      shipFee: 3850,
    } as any, // 스키마에 boxQty/shipFee/message가 이미 있으면 문제 없음
  });

  console.log("✅ seed complete");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });