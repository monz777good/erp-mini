import { PrismaClient, Role, OrderStatus } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // ✅ 관리자/영업사원 샘플 (필요하면 전화번호만 바꿔)
  const admin = await prisma.user.upsert({
    where: { phone: "01023833691" },
    update: { name: "이현택", role: Role.ADMIN },
    create: { name: "이현택", phone: "01023833691", role: Role.ADMIN },
  });

  const sales = await prisma.user.upsert({
    where: { phone: "01012341234" },
    update: { name: "영업사원", role: Role.SALES },
    create: { name: "영업사원", phone: "01012341234", role: Role.SALES },
  });

  // ✅ 품목 샘플
  const item = await prisma.item.upsert({
    where: { name: "쌍화탕" },
    update: {},
    create: { name: "쌍화탕" },
  });

  // ✅ 거래처 샘플 (새 필드명으로!)
  const client = await prisma.client.upsert({
    where: { id: "seed-client-1" },
    update: {},
    create: {
      id: "seed-client-1",
      userId: sales.id,
      name: "한한한의원",
      ownerName: "한한왕",
      bizRegNo: "123123123",
      careInstitutionNo: "113212213",
      receiverName: "한한왕",
      receiverAddr: "경기도 안산시 한한동",
      receiverTel: "01000000000",
      receiverMobile: "01111111111",
      memo: "뽀",
      // bizFileUrl / bizFileName 은 업로드 붙인 뒤에 채워짐
    },
  });

  // ✅ 주문 샘플 (Order 필드도 현재 스키마와 맞춰서!)
  await prisma.order.create({
    data: {
      userId: sales.id,
      clientId: client.id,
      itemId: item.id,
      status: OrderStatus.REQUESTED,
      quantity: 1,
      receiverName: client.receiverName ?? "수하인",
      receiverAddr: client.receiverAddr ?? "주소",
      phone: client.receiverTel,
      mobile: client.receiverMobile,
      note: "샘플주문",
    },
  });

  console.log("✅ seed 완료");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });