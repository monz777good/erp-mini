// prisma/seed.ts
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function digitsOnly(v: string) {
  return String(v ?? "").replace(/\D/g, "");
}

async function main() {
  // 1) 관리자/영업 샘플 유저(없으면 생성)
  const admin = await prisma.user.upsert({
    where: { phone: "01000000000" },
    update: { name: "관리자", role: "ADMIN" },
    create: {
      name: "관리자",
      phone: "01000000000",
      role: "ADMIN",
    },
  });

  const sales = await prisma.user.upsert({
    where: { phone: "01022222222" },
    update: { name: "영업사원", role: "SALES" },
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

  // 3) 샘플 거래처(없으면 생성)  ✅ (사업자등록증 칼럼도 준비되어 있으니 여기서 만들자)
  const client = await prisma.client.upsert({
    where: { bizRegNo: "123-45-67890" },
    update: { name: "샘플거래처" },
    create: {
      name: "샘플거래처",
      bizRegNo: "123-45-67890",
      receiverName: "이현택",
      receiverAddr: "경기도 시흥시 (테스트 주소)",
      receiverTel: digitsOnly("010-2383-3691"),
      receiverMob: digitsOnly("010-2383-3691"),
      memo: "seed 테스트",
      // bizFileUrl / bizFileName 는 업로드 기능에서 채워질 예정
    },
  });

  // 4) 샘플 주문 1개 생성 ✅ (스키마 필드명 정확히)
  await prisma.order.create({
    data: {
      userId: sales.id,
      itemId: item.id,
      clientId: client.id,

      quantity: 1,
      status: "REQUESTED",
      note: "seed 테스트",

      receiverName: "이현택",
      receiverAddr: "경기도 시흥시 (테스트 주소)",
      receiverTel: digitsOnly("01023833691"),
      receiverMob: digitsOnly("01023833691"),

      message: "취급주의",
      boxCount: 1,
      shippingFee: 3850,
    },
  });

  console.log("✅ seed complete");
  console.log("ADMIN:", admin.phone, " / SALES:", sales.phone);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });