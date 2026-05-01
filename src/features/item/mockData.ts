// 물품 모의 데이터: 개발 환경에서 사용할 샘플 물품 데이터
import type { Item } from './types'  // 물품 타입

/**
 * 모의 물품 데이터 배열
 * 
 * 기능:
 * - 개발 환경에서 사용할 샘플 물품 데이터 제공
 * - 다양한 카테고리와 가격대의 물품 포함
 * - 중고거래, 대여, 나눔 등 다양한 거래 유형 포함
 * - 에스크로 서비스 적용 여부 포함
 */
export const MOCK_ITEMS: Item[] = [
  // 기존 1-20 범위
  ...Array.from({ length: 20 }, (_, i) => ({
    id: i + 1,  // 물품 고유 ID
    title: [
      '에어팟 프로 2세대', '맥북 프로 M2 14인치', '캐논 EOS R50 카메라',
      '개발 서적 모음 10권', '나이키 패딩 점퍼 M사이즈', '네스프레소 캡슐 커피머신',
      '아이패드 프로 12.9인치', '캠핑 텐트 4인용', '갤럭시 S23 울트라',
      '원목 6인용 식탁 세트', '요가 매트 + 블록 세트', '아동 도서 50권',
      '소니 WH-1000XM5 헤드폰', '닌텐도 스위치 OLED', '다이슨 무선 청소기',
      '러닝머신 접이식', '전동 킥보드', '미니 냉장고',
      '로봇청소기 룸바', '어쿠스틱 기타',
    ][i],  // 물품 제목 배열
    description: '상태 매우 양호해요. 직거래 선호하며 택배도 가능해요.\n\n구매 후 1년 이내 제품이고 기스 없이 깨끗하게 사용했습니다.',  // 물품 설명
    price: [180000, 1650000, 0, 0, 45000, 55000, 780000, 0, 650000, 280000,
            15000, 0, 320000, 250000, 450000, 200000, 180000, 0, 350000, 0][i],  // 판매 가격 (0은 나눔)
    rentPrice: [8000, 20000, 0, 0, 5000, 7000, 25000, 15000, 0, 12000,
                4000, 0, 15000, 18000, 0, 9000, 5000, 0, 12000, 3000][i],  // 대여 가격 (0은 대여 불가)
    itemType: (['SELL','SELL','RENT','SHARE','SELL','SELL','SELL','RENT','SELL','SELL',
                 'SELL','SHARE','SELL','SELL','SELL','SELL','RENT','SELL','SELL','SELL'][i]) as Item['itemType'],  // 거래 유형
    status: 'ACTIVE' as const,  // 물품 상태 (판매중)
    category: ['electronics','electronics','electronics','books','clothing','household',
                'electronics','sports','electronics','furniture','sports','books',
                'electronics','electronics','household','sports','other','household',
                'household','other'][i],  // 카테고리
    brand: ['apple','apple','canon',undefined,'nike','nespresso','apple',undefined,'samsung',undefined,
            undefined,undefined,'sony','nintendo','dyson',undefined,undefined,'lg','samsung',undefined][i],  // 브랜드
    isEscrow: [true,false,true,false,true,false,true,false,true,false,true,false,true,false,true,false,true,false,true,false][i],  // 에스크로 적용 여부
    hashtags: [
      ['애플','에어팟'],['애플','맥북'],['카메라','대여'],['도서','개발'],
      ['나이키','의류'],['커피','가전'],['애플','태블릿'],['캠핑','대여'],
      ['삼성','스마트폰'],['가구','원목'],['요가','운동'],['도서','나눔'],
      ['소니','헤드폰'],['닌텐도','게임'],['다이슨','가전'],['운동','헬스'],
      ['킥보드','대여'],['냉장고','가전'],['청소기','가전'],['기타','악기'],
    ][i],
    imageUrls: [],
    wishCount: [34,21,57,89,12,8,44,33,29,16,7,61,25,48,19,11,38,6,42,15][i],
    viewCount: [120,85,200,310,45,30,160,95,110,60,25,220,90,175,70,40,130,20,155,55][i],
    isWished: false,
    sellerId: (i % 5) + 1,
    sellerNickname: ['김민준','이서아','박지호','최하은','정현우'][(i % 5)],
    sellerProfileImageUrl: null,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * (i + 1)).toISOString(),
  })),
  // 거래 내역에서 사용할 101-120 범위 추가
  ...Array.from({ length: 20 }, (_, i) => {
    const id = i + 101
    const itemTypes = ['SELL', 'RENT', 'SHARE'] as const
    const itemType = itemTypes[i % 3] as Item['itemType']
    return {
      id,
      title: `거래 물품 ${id}`,
      description: `이것은 거래 물품 ${id}의 상세 설명입니다. 상태가 매우 양호해요.`,
      price: itemType === 'SHARE' ? 0 : (i + 1) * 10_000,
      rentPrice: itemType === 'RENT' ? (i + 1) * 2_000 : 0,
      itemType,
      status: 'SOLD' as const,
      category: ['전자기기', '의류', '도서', '생활'][i % 4],
      brand: undefined,
      isEscrow: i % 2 === 0,
      hashtags: ['중고', '직거래'],
      imageUrls: [],
      wishCount: Math.floor(Math.random() * 20),
      viewCount: Math.floor(Math.random() * 100),
      isWished: false,
      sellerId: 2,
      sellerNickname: '판매자',
      sellerProfileImageUrl: null,
      buyerNickname: `구매자${i}`,
      createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
    }
  })
]
