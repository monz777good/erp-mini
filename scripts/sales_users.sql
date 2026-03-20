
INSERT INTO "User" ("id", "name", "phone", "role", "pin", "createdAt")
VALUES ('sales_001', '이석희', '01038284010', 'SALES', '65d3daad33f2159a6ba68171634ed7bacc32d060cd65a766538298a9a3f17c64', NOW())
ON CONFLICT ("phone")
DO UPDATE SET
  "name" = EXCLUDED."name",
  "role" = EXCLUDED."role",
  "pin" = EXCLUDED."pin";

INSERT INTO "User" ("id", "name", "phone", "role", "pin", "createdAt")
VALUES ('sales_002', '김성경', '01052406349', 'SALES', 'ef6afa5086fed3e79731af1f1d22dd98488045b82b90be68093ff0c873aae95d', NOW())
ON CONFLICT ("phone")
DO UPDATE SET
  "name" = EXCLUDED."name",
  "role" = EXCLUDED."role",
  "pin" = EXCLUDED."pin";

INSERT INTO "User" ("id", "name", "phone", "role", "pin", "createdAt")
VALUES ('sales_003', '장상현', '01082668253', 'SALES', '48204b131a40ea2d4adcb5ff1ee75cded60cba8a9c363fe8306325cdb4862812', NOW())
ON CONFLICT ("phone")
DO UPDATE SET
  "name" = EXCLUDED."name",
  "role" = EXCLUDED."role",
  "pin" = EXCLUDED."pin";

INSERT INTO "User" ("id", "name", "phone", "role", "pin", "createdAt")
VALUES ('sales_004', '한재진', '01090551075', 'SALES', '85867b4979d7be8720fa2fa2dc1a0084b4ba582aef1bf307c643210508e903fd', NOW())
ON CONFLICT ("phone")
DO UPDATE SET
  "name" = EXCLUDED."name",
  "role" = EXCLUDED."role",
  "pin" = EXCLUDED."pin";

INSERT INTO "User" ("id", "name", "phone", "role", "pin", "createdAt")
VALUES ('sales_005', '오승훈', '01092407005', 'SALES', '927d72e3eed484422ac50a4514621525e7a92b9f935dec1ac01bb2d611b475fa', NOW())
ON CONFLICT ("phone")
DO UPDATE SET
  "name" = EXCLUDED."name",
  "role" = EXCLUDED."role",
  "pin" = EXCLUDED."pin";

INSERT INTO "User" ("id", "name", "phone", "role", "pin", "createdAt")
VALUES ('sales_006', '안중률', '0100000000', 'SALES', 'c5c8c6115aba8dd1c823a2becde70bb47e4ab5dc39e2233e0585a7328e161f37', NOW())
ON CONFLICT ("phone")
DO UPDATE SET
  "name" = EXCLUDED."name",
  "role" = EXCLUDED."role",
  "pin" = EXCLUDED."pin";

INSERT INTO "User" ("id", "name", "phone", "role", "pin", "createdAt")
VALUES ('sales_007', '박주형', '01073114145', 'SALES', '6cbf95a02e3e3f2c0753c5eb556f55b37df0d0ec340e9ed1b55c43dad84c412f', NOW())
ON CONFLICT ("phone")
DO UPDATE SET
  "name" = EXCLUDED."name",
  "role" = EXCLUDED."role",
  "pin" = EXCLUDED."pin";

INSERT INTO "User" ("id", "name", "phone", "role", "pin", "createdAt")
VALUES ('sales_008', '정덕호', '01074110984', 'SALES', '1620ba17d65b64db09538c4aa2b70ced5e8f28961e66d6f86a851fda49252ae1', NOW())
ON CONFLICT ("phone")
DO UPDATE SET
  "name" = EXCLUDED."name",
  "role" = EXCLUDED."role",
  "pin" = EXCLUDED."pin";

INSERT INTO "User" ("id", "name", "phone", "role", "pin", "createdAt")
VALUES ('sales_009', '김성곤', '023892607', 'SALES', '8156a536d476100a4e8dfe6cd0e5083829cf350593ea6e2aefa686cc302a0677', NOW())
ON CONFLICT ("phone")
DO UPDATE SET
  "name" = EXCLUDED."name",
  "role" = EXCLUDED."role",
  "pin" = EXCLUDED."pin";

INSERT INTO "User" ("id", "name", "phone", "role", "pin", "createdAt")
VALUES ('sales_010', '김현경', '01047459244', 'SALES', '70069eb20f410582d5827feb91fefd1f75fc796abe0426ddc4c92a02166f610e', NOW())
ON CONFLICT ("phone")
DO UPDATE SET
  "name" = EXCLUDED."name",
  "role" = EXCLUDED."role",
  "pin" = EXCLUDED."pin";

INSERT INTO "User" ("id", "name", "phone", "role", "pin", "createdAt")
VALUES ('sales_011', '김형태', '01030146680', 'SALES', '3c31cce9fd8ce9aebd195f8d92868b0f2d1d24d27ec492991611e590942ce622', NOW())
ON CONFLICT ("phone")
DO UPDATE SET
  "name" = EXCLUDED."name",
  "role" = EXCLUDED."role",
  "pin" = EXCLUDED."pin";

INSERT INTO "User" ("id", "name", "phone", "role", "pin", "createdAt")
VALUES ('sales_012', '정인래', '01042220555', 'SALES', 'ff24bbdf823e1ecbb84caec646bdde4248352022093e77928987602d9aa936cf', NOW())
ON CONFLICT ("phone")
DO UPDATE SET
  "name" = EXCLUDED."name",
  "role" = EXCLUDED."role",
  "pin" = EXCLUDED."pin";

INSERT INTO "User" ("id", "name", "phone", "role", "pin", "createdAt")
VALUES ('sales_013', '이병철', '01085055476', 'SALES', 'eef949ad3d8804defa3c4108a48de05dca92634d82c70b6eef6af7b4f5c72f0c', NOW())
ON CONFLICT ("phone")
DO UPDATE SET
  "name" = EXCLUDED."name",
  "role" = EXCLUDED."role",
  "pin" = EXCLUDED."pin";

INSERT INTO "User" ("id", "name", "phone", "role", "pin", "createdAt")
VALUES ('sales_014', '이성로', '01064807442', 'SALES', 'ae84377524302ef6be35850b75579033f8ed1188b9d9bddf377d9daf3cb61243', NOW())
ON CONFLICT ("phone")
DO UPDATE SET
  "name" = EXCLUDED."name",
  "role" = EXCLUDED."role",
  "pin" = EXCLUDED."pin";

INSERT INTO "User" ("id", "name", "phone", "role", "pin", "createdAt")
VALUES ('sales_015', '안광민', '01062016317', 'SALES', '370d3c48e763a1f3fc4a0f3868527e120489a96ed986017b54db72274fccdc7f', NOW())
ON CONFLICT ("phone")
DO UPDATE SET
  "name" = EXCLUDED."name",
  "role" = EXCLUDED."role",
  "pin" = EXCLUDED."pin";

INSERT INTO "User" ("id", "name", "phone", "role", "pin", "createdAt")
VALUES ('sales_016', '권세종', '01029053339', 'SALES', 'cde672ffef6a76d8c6ecf5476e8c21cb53c5009789b2495d77e59a8d25ebc04c', NOW())
ON CONFLICT ("phone")
DO UPDATE SET
  "name" = EXCLUDED."name",
  "role" = EXCLUDED."role",
  "pin" = EXCLUDED."pin";

INSERT INTO "User" ("id", "name", "phone", "role", "pin", "createdAt")
VALUES ('sales_017', '용경원', '01045715349', 'SALES', 'db63728cf0714efc3caffafc904bb1454b4e5e0164227e1aa743b26229ca81b8', NOW())
ON CONFLICT ("phone")
DO UPDATE SET
  "name" = EXCLUDED."name",
  "role" = EXCLUDED."role",
  "pin" = EXCLUDED."pin";

INSERT INTO "User" ("id", "name", "phone", "role", "pin", "createdAt")
VALUES ('sales_018', '최성환', '01031114352', 'SALES', 'ae6c998a21229cfaa8d5dbc46de0d6d642f19c083dd47547824590a727958a20', NOW())
ON CONFLICT ("phone")
DO UPDATE SET
  "name" = EXCLUDED."name",
  "role" = EXCLUDED."role",
  "pin" = EXCLUDED."pin";

INSERT INTO "User" ("id", "name", "phone", "role", "pin", "createdAt")
VALUES ('sales_019', '이성재', '01043510464', 'SALES', 'e4f048b5c6c2f79e8865468230c624b2fde640bbd1a1bdd6c896ab046809a8b7', NOW())
ON CONFLICT ("phone")
DO UPDATE SET
  "name" = EXCLUDED."name",
  "role" = EXCLUDED."role",
  "pin" = EXCLUDED."pin";

INSERT INTO "User" ("id", "name", "phone", "role", "pin", "createdAt")
VALUES ('sales_020', '임재규', '01052362558', 'SALES', '2af45edec8b4a826823f127b09968b8d25ce46e3cf38201c16e5bac942a1e74d', NOW())
ON CONFLICT ("phone")
DO UPDATE SET
  "name" = EXCLUDED."name",
  "role" = EXCLUDED."role",
  "pin" = EXCLUDED."pin";

INSERT INTO "User" ("id", "name", "phone", "role", "pin", "createdAt")
VALUES ('sales_021', '이주성', '01066245579', 'SALES', '43865e86823f326394591da70694d261744b23df7049c5cf91404846d888dd2c', NOW())
ON CONFLICT ("phone")
DO UPDATE SET
  "name" = EXCLUDED."name",
  "role" = EXCLUDED."role",
  "pin" = EXCLUDED."pin";

INSERT INTO "User" ("id", "name", "phone", "role", "pin", "createdAt")
VALUES ('sales_022', '백승철', '01032529181', 'SALES', 'd967dc5780f803ac9e339e2d3314325e67beeb28da4c481f600cc600b4efe0d4', NOW())
ON CONFLICT ("phone")
DO UPDATE SET
  "name" = EXCLUDED."name",
  "role" = EXCLUDED."role",
  "pin" = EXCLUDED."pin";

INSERT INTO "User" ("id", "name", "phone", "role", "pin", "createdAt")
VALUES ('sales_023', '원진수', '01025187278', 'SALES', 'e140174288da01bb3e733dbe2271111293c4957d8e21f5d81625b80738b2c927', NOW())
ON CONFLICT ("phone")
DO UPDATE SET
  "name" = EXCLUDED."name",
  "role" = EXCLUDED."role",
  "pin" = EXCLUDED."pin";

INSERT INTO "User" ("id", "name", "phone", "role", "pin", "createdAt")
VALUES ('sales_024', '박일도', '01046241085', 'SALES', '21148b18d830787ebdb531afc6fb506235eefba912c27ecf03b58403b713317b', NOW())
ON CONFLICT ("phone")
DO UPDATE SET
  "name" = EXCLUDED."name",
  "role" = EXCLUDED."role",
  "pin" = EXCLUDED."pin";

INSERT INTO "User" ("id", "name", "phone", "role", "pin", "createdAt")
VALUES ('sales_025', '김성희', '01063449682', 'SALES', 'd560c79c662ca7f116795753ce9318d676e4fe25519f067ded953e92800776e6', NOW())
ON CONFLICT ("phone")
DO UPDATE SET
  "name" = EXCLUDED."name",
  "role" = EXCLUDED."role",
  "pin" = EXCLUDED."pin";

INSERT INTO "User" ("id", "name", "phone", "role", "pin", "createdAt")
VALUES ('sales_026', '김현철', '01093321006', 'SALES', '99218c79fdd123f85ef20eb4130c0706320e188d14aa522a94cac0e913cf2186', NOW())
ON CONFLICT ("phone")
DO UPDATE SET
  "name" = EXCLUDED."name",
  "role" = EXCLUDED."role",
  "pin" = EXCLUDED."pin";

INSERT INTO "User" ("id", "name", "phone", "role", "pin", "createdAt")
VALUES ('sales_027', '이정민', '01043991031', 'SALES', 'ef118ae40560211dc121ef7e20f8cfd37225887d8a023aea248f238769916ce1', NOW())
ON CONFLICT ("phone")
DO UPDATE SET
  "name" = EXCLUDED."name",
  "role" = EXCLUDED."role",
  "pin" = EXCLUDED."pin";

INSERT INTO "User" ("id", "name", "phone", "role", "pin", "createdAt")
VALUES ('sales_028', '엄득원', '01035749087', 'SALES', 'e9c02571fb2067cd501e7d8d77c2bd6ca977b11c06bf2ff6cb9429f5bef60816', NOW())
ON CONFLICT ("phone")
DO UPDATE SET
  "name" = EXCLUDED."name",
  "role" = EXCLUDED."role",
  "pin" = EXCLUDED."pin";

INSERT INTO "User" ("id", "name", "phone", "role", "pin", "createdAt")
VALUES ('sales_029', '오창근', '01032410975', 'SALES', '8d997b6e636fd32f0b88477295a51f3526912c8876bb9ca24288445096da7563', NOW())
ON CONFLICT ("phone")
DO UPDATE SET
  "name" = EXCLUDED."name",
  "role" = EXCLUDED."role",
  "pin" = EXCLUDED."pin";

INSERT INTO "User" ("id", "name", "phone", "role", "pin", "createdAt")
VALUES ('sales_030', '전영하', '01090407508', 'SALES', '24a967ceb256500be509d9f5be53bc16721cab0f9481bc97cb3f2d46b989f1ea', NOW())
ON CONFLICT ("phone")
DO UPDATE SET
  "name" = EXCLUDED."name",
  "role" = EXCLUDED."role",
  "pin" = EXCLUDED."pin";

INSERT INTO "User" ("id", "name", "phone", "role", "pin", "createdAt")
VALUES ('sales_031', '최진호', '01029499898', 'SALES', '355ba3b4d6359caaf2633aa3324194c9dfc64663af6c69b61a60e35cd1684abf', NOW())
ON CONFLICT ("phone")
DO UPDATE SET
  "name" = EXCLUDED."name",
  "role" = EXCLUDED."role",
  "pin" = EXCLUDED."pin";

INSERT INTO "User" ("id", "name", "phone", "role", "pin", "createdAt")
VALUES ('sales_032', '박효형', '01033654045', 'SALES', '2331434fcf83c6504a83026c98fa6bb7b171e600ab2256cdaae9aa3b96bb8ea4', NOW())
ON CONFLICT ("phone")
DO UPDATE SET
  "name" = EXCLUDED."name",
  "role" = EXCLUDED."role",
  "pin" = EXCLUDED."pin";

INSERT INTO "User" ("id", "name", "phone", "role", "pin", "createdAt")
VALUES ('sales_033', '강동수', '01066698365', 'SALES', '6c19393e90dc01b186f554c5ecfdb704f43da2a36f11fdedcf1e6b8629804057', NOW())
ON CONFLICT ("phone")
DO UPDATE SET
  "name" = EXCLUDED."name",
  "role" = EXCLUDED."role",
  "pin" = EXCLUDED."pin";

INSERT INTO "User" ("id", "name", "phone", "role", "pin", "createdAt")
VALUES ('sales_034', '김효병', '01074159265', 'SALES', '18441114a97853480ff6e3ee63d22572221d302918929a4ea119e8b8cde250ea', NOW())
ON CONFLICT ("phone")
DO UPDATE SET
  "name" = EXCLUDED."name",
  "role" = EXCLUDED."role",
  "pin" = EXCLUDED."pin";

INSERT INTO "User" ("id", "name", "phone", "role", "pin", "createdAt")
VALUES ('sales_035', '이창일', '01077717592', 'SALES', '01ecd1afae6775e72b8a9e5c11b40f3423b910f540967bb6c3c76e0eb1ad1ec3', NOW())
ON CONFLICT ("phone")
DO UPDATE SET
  "name" = EXCLUDED."name",
  "role" = EXCLUDED."role",
  "pin" = EXCLUDED."pin";

INSERT INTO "User" ("id", "name", "phone", "role", "pin", "createdAt")
VALUES ('sales_036', '이건찬', '01034771664', 'SALES', '89857f9149063f0c3cf7d0a5217a6988eff8035349f1b7f157a97617d56ea1f1', NOW())
ON CONFLICT ("phone")
DO UPDATE SET
  "name" = EXCLUDED."name",
  "role" = EXCLUDED."role",
  "pin" = EXCLUDED."pin";

INSERT INTO "User" ("id", "name", "phone", "role", "pin", "createdAt")
VALUES ('sales_037', '성재곤', '01085330082', 'SALES', '85803e9df036321a3c1807fabfb9f18cde53be4c13d7164b28827872da574833', NOW())
ON CONFLICT ("phone")
DO UPDATE SET
  "name" = EXCLUDED."name",
  "role" = EXCLUDED."role",
  "pin" = EXCLUDED."pin";

INSERT INTO "User" ("id", "name", "phone", "role", "pin", "createdAt")
VALUES ('sales_038', '손철원', '01064057204', 'SALES', 'dfe32715307966060fed85df3cd65acc02ea0b0236970cc7524f688580175e73', NOW())
ON CONFLICT ("phone")
DO UPDATE SET
  "name" = EXCLUDED."name",
  "role" = EXCLUDED."role",
  "pin" = EXCLUDED."pin";

INSERT INTO "User" ("id", "name", "phone", "role", "pin", "createdAt")
VALUES ('sales_039', '성상경', '01038546261', 'SALES', 'b431fb6e48e09d4f03df0ceddfd7ff0c2d6558e8d5c87f1af62082663cebd174', NOW())
ON CONFLICT ("phone")
DO UPDATE SET
  "name" = EXCLUDED."name",
  "role" = EXCLUDED."role",
  "pin" = EXCLUDED."pin";

INSERT INTO "User" ("id", "name", "phone", "role", "pin", "createdAt")
VALUES ('sales_040', '이름', '01052362558', 'SALES', '2048f0f447c8db2a97b370475f2e8d861957bbb68a906bdaa85164c3796c14eb', NOW())
ON CONFLICT ("phone")
DO UPDATE SET
  "name" = EXCLUDED."name",
  "role" = EXCLUDED."role",
  "pin" = EXCLUDED."pin";
