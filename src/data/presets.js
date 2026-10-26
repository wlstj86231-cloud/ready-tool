// Evidence checklists per trade type. Shared by the evidence-pack tool and the static guides.
// kind: photo | video | doc | any. need: true = 꼭 남길 것, false = 있으면 좋은 것.
// readable: true = 글자·숫자가 읽혀야 하는 사진(작은 사진 경고 대상).

export const presets = {
  machinery: {
    id: "machinery",
    label: "중고 농기계 사고팔기",
    short: "농기계",
    example: "트랙터판매",
    intro: "판매글을 올리기 전, 구매자가 실물을 확인할 때, 기계를 넘겨주는 날까지 아래 순서로 남겨 두면 나중에 \"그때 상태가 어땠는지\"를 서로 같은 자료로 확인할 수 있습니다.",
    groups: [
      { id: "check", label: "기계 상태 (판매글·실물 확인 때)" },
      { id: "papers", label: "서류와 돈 (계약할 때)" },
      { id: "handover", label: "넘겨주는 날 (인도할 때)" },
    ],
    items: [
      { id: "overall", group: "check", name: "기계 전체", file: "전체", kind: "photo", need: true, why: "앞·뒤·좌·우 네 방향에서 기계 전체가 한 장에 들어오게 찍습니다. 기종과 외관 손상(찌그러짐·녹·깨진 등)을 한눈에 비교하는 기준 사진입니다.", tip: "밝은 낮에, 기계에서 서너 걸음 떨어져 찍으세요." },
      { id: "nameplate", group: "check", name: "명판(형식명·제조번호)", file: "명판", kind: "photo", need: true, readable: true, why: "판매글에 적은 모델과 실제 기계가 같은지 대조하는 핵심 사진입니다. 형식명·제조번호 글자가 또렷하게 읽혀야 합니다.", tip: "명판에 바짝 다가가 그림자가 지지 않게 찍고, 남에게 공개하는 사본에서는 제조번호 뒷자리를 가리세요." },
      { id: "frame", group: "check", name: "차대번호·엔진번호 각인", file: "차대번호", kind: "photo", need: true, readable: true, why: "명판이 떨어졌거나 교체된 기계도 프레임과 엔진에 새겨진 번호로 같은 기계인지 대조할 수 있습니다.", tip: "위치를 모르면 판매자에게 물어보세요. 흙·기름을 닦고 비스듬히 빛을 비추면 각인이 잘 보입니다." },
      { id: "hourmeter", group: "check", name: "사용시간계(아워미터)", file: "사용시간계", kind: "photo", need: true, readable: true, why: "판매글에 적은 사용시간과 실제 계기판 숫자를 맞춰 보는 사진입니다. 넘겨주는 날 다시 찍어 두 숫자를 비교하면 그 사이 얼마나 썼는지도 알 수 있습니다.", tip: "시동을 켠 상태에서 숫자 전체가 반사 없이 보이게 찍습니다." },
      { id: "leak", group: "check", name: "누유 부위", file: "누유", kind: "photo", need: true, why: "엔진 아래, 미션 케이스, 유압 실린더·호스 연결부, 기계를 세워 둔 바닥의 기름 자국을 찍습니다. 기름이 새지 않았다면 \"누유 없음\"을 보여 주는 사진도 같은 위치에서 남깁니다.", tip: "시동 후 10분쯤 지나 다시 한 번 바닥을 확인하면 숨은 누유가 드러나기도 합니다." },
      { id: "tires", group: "check", name: "타이어·궤도 마모", file: "타이어", kind: "photo", need: false, why: "타이어 홈 깊이, 궤도(크롤러) 갈라짐은 교체 비용과 직결되어 가격 협의 때 자주 다툼이 됩니다.", tip: "바퀴마다 한 장씩, 홈이 보이게 비스듬히 찍습니다." },
      { id: "engine", group: "check", name: "엔진룸·라디에이터", file: "엔진룸", kind: "photo", need: false, why: "엔진오일·냉각수 상태, 벨트, 배선 손상, 용접·수리 흔적을 남깁니다.", tip: "덮개를 연 상태에서 전체 한 장, 눈에 띄는 부분은 가까이 한 장." },
      { id: "video", group: "check", name: "시동·작동 영상", file: "작동영상", kind: "video", need: false, why: "엔진이 식은 상태의 시동(냉간 시동), PTO 회전, 유압 리프트 올림·내림, 짧은 주행을 30초~1분 영상으로 남깁니다. 사진으로는 알 수 없는 소리·연기·떨림이 기록됩니다.", tip: "영상 시작 때 사용시간계를 함께 비추면 언제 찍은 영상인지 맞춰 보기 쉽습니다." },
      { id: "implements", group: "check", name: "포함 작업기·부속", file: "작업기", kind: "photo", need: false, why: "로터리·로더·쟁기 같은 작업기, 열쇠, 설명서, 예비 부품처럼 \"같이 넘기기로 한 것\"을 찍어 둡니다. 포함 여부는 거래 뒤 가장 흔한 다툼거리입니다.", tip: "포함되는 것들을 한자리에 모아 한 장으로도 찍어 두세요." },
      { id: "defects", group: "check", name: "알려 준 결함·수리 부위", file: "결함", kind: "photo", need: false, why: "판매자가 미리 알린 흠집, 용접 부위, 고장 난 부분을 찍어 두면 \"알고 산 결함\"과 \"숨긴 결함\"을 나중에 구분할 수 있습니다.", tip: "결함마다 한 장씩, 메모 칸에 판매자가 설명한 내용을 적어 두세요." },
      { id: "service", group: "papers", name: "정비·수리 기록, 구입 서류", file: "정비기록", kind: "doc", need: false, why: "정비 영수증, 부품 교체 내역, 처음 살 때의 서류는 사용 이력과 소유 관계를 확인하는 자료입니다.", tip: "종이는 평평한 곳에 놓고 네 모서리가 다 나오게 찍거나 스캔합니다." },
      { id: "contract", group: "papers", name: "매매 계약서(또는 합의 내용)", file: "계약서", kind: "doc", need: true, why: "가격, 인도 날짜·장소, 작업기 포함 여부, 알려 준 결함, 운송비를 누가 내는지를 적은 종이 계약서나 문자·메신저 합의 화면입니다.", tip: "서명한 계약서는 양쪽이 같은 사본을 한 부씩 가지세요." },
      { id: "payment", group: "papers", name: "입금 내역", file: "입금내역", kind: "doc", need: true, readable: true, why: "계약금·잔금을 언제 얼마 보냈는지 보여 주는 이체 확인증이나 통장 거래내역 화면입니다.", tip: "인터넷뱅킹·은행 앱의 이체확인증 저장 기능을 쓰면 깔끔합니다. 남에게 보낼 때는 계좌번호 일부를 가리세요." },
      { id: "handover", group: "handover", name: "인도 시점 사진", file: "인도", kind: "photo", need: true, why: "넘겨주는 날, 넘겨주는 장소에서 기계 전체와 사용시간계를 다시 찍습니다. 이 사진이 \"넘겨줄 때의 상태\"를 보여 주는 마지막 기록입니다.", tip: "판매자·구매자가 함께 확인한 뒤 찍고, 서로 사진을 나눠 가지세요." },
      { id: "transport", group: "handover", name: "탁송 상차·하차 사진, 견적서", file: "탁송", kind: "any", need: false, why: "탁송 차량에 싣기 전, 결박한 모습, 내린 뒤의 상태와 탁송 견적서·영수증입니다. 운송 중 생긴 손상과 원래 있던 손상을 구분해 줍니다.", tip: "실은 직후와 내린 직후 같은 방향에서 찍어야 비교가 쉽습니다." },
    ],
  },
  produce: {
    id: "produce",
    label: "농산물 보내기(출하·택배)",
    short: "농산물",
    example: "사과10kg출하",
    intro: "상자를 닫기 전부터 받는 사람이 열어 볼 때까지의 흐름대로 남기면, 무게가 모자란다거나 상해서 왔다는 이야기가 나왔을 때 어느 단계의 일인지 차분히 확인할 수 있습니다.",
    groups: [
      { id: "before", label: "출하 전 (상자 닫기 전)" },
      { id: "send", label: "보낼 때" },
      { id: "after", label: "주문·돈·도착" },
    ],
    items: [
      { id: "state", group: "before", name: "출하 전 전체 상태", file: "출하전상태", kind: "photo", need: true, why: "선별을 마친 상품 전체를 크기·색깔이 보이게 찍습니다. 보낸 물건이 어떤 상태였는지 보여 주는 기준 사진입니다.", tip: "자연광에서, 상자 안에 담긴 모습 그대로 위에서 찍으세요." },
      { id: "closeup", group: "before", name: "크기·흠 근접 사진", file: "근접", kind: "photo", need: false, why: "대표 과실·채소를 가까이 찍어 크기와 흠집 유무를 남깁니다. 자나 동전을 옆에 두면 크기를 비교하기 쉽습니다.", tip: "흠이 있는 것을 알고 보냈다면 그것도 찍어 두세요." },
      { id: "weight", group: "before", name: "실중량(저울 눈금)", file: "중량", kind: "photo", need: true, readable: true, why: "상자째 무게와 빈 상자 무게(또는 용기를 뺀 내용물 무게)를 저울 숫자가 읽히게 찍습니다. \"10kg이라더니 모자란다\"는 말이 나올 때 가장 먼저 찾는 사진입니다.", tip: "저울을 영점에 맞춘 화면부터 한 장, 올린 뒤 한 장." },
      { id: "packing", group: "before", name: "포장 상태(완충재·내부)", file: "포장", kind: "photo", need: true, why: "완충재를 넣은 상자 안쪽과 테이프로 막기 전 모습입니다. 운송 중 파손 여부를 따질 때 포장을 어떻게 했는지가 기준이 됩니다.", tip: "뚜껑을 덮기 직전 한 장, 테이프를 붙인 뒤 한 장." },
      { id: "label", group: "before", name: "포장 겉면·표시", file: "표시", kind: "photo", need: false, readable: true, why: "상자 겉면의 품목·산지·중량·생산자 연락처 표시를 찍습니다. 무엇을 얼마나 보냈다고 표시했는지 남겨 둡니다.", tip: "표시 글자가 읽히게 정면에서 찍습니다." },
      { id: "waybill", group: "send", name: "운송장", file: "운송장", kind: "photo", need: true, readable: true, why: "상자에 붙인 운송장을 송장번호가 읽히게 찍습니다. 배송 조회와 사고 접수 때 송장번호가 필요합니다.", tip: "남에게 보여 줄 사본에서는 받는 사람 이름·주소·전화번호를 가리세요." },
      { id: "receipt", group: "send", name: "발송 접수 증빙", file: "접수증", kind: "any", need: true, why: "택배 접수 영수증이나 택배 앱의 접수 완료 화면입니다. 직접 건넸다면 건넨 장소·시간을 알 수 있는 사진을 남깁니다.", tip: "여러 상자를 한 번에 보냈다면 송장번호 목록이 보이는 화면을 저장하세요." },
      { id: "order", group: "after", name: "주문·판매 조건", file: "주문내용", kind: "doc", need: true, why: "품목·수량·가격·배송비를 누가 내는지·교환과 환불 기준을 주고받은 메시지나 주문서 화면입니다.", tip: "대화가 길면 조건이 정해진 부분만 골라 캡처하세요." },
      { id: "deposit", group: "after", name: "입금 내역", file: "입금내역", kind: "doc", need: true, readable: true, why: "대금이 언제 얼마 들어왔는지 보여 주는 통장 거래내역이나 입금 알림 화면입니다.", tip: "공유할 때는 계좌번호와 다른 거래 내역을 가리세요." },
      { id: "arrival", group: "after", name: "도착·수령 확인", file: "도착확인", kind: "any", need: false, why: "배송 완료 화면, 구매자가 보내 준 도착 사진입니다. 언제 도착했는지 알아야 상한 시점을 따질 수 있습니다.", tip: "구매자에게 받은 사진은 받은 날짜를 메모 칸에 적어 두세요." },
      { id: "problem", group: "after", name: "문제가 생겼을 때 받은 사진·대화", file: "문제", kind: "any", need: false, why: "파손·부패 이야기가 나오면 상자 겉면 → 개봉 → 내용물 순서의 사진과 주고받은 대화를 그대로 남깁니다.", tip: "운송 중 손상이라면 택배사 사고 접수도 서둘러야 합니다." },
    ],
  },
  settlement: {
    id: "settlement",
    label: "정산·입금 정리",
    short: "정산",
    example: "10월정산",
    intro: "한 달 또는 한 시즌의 판매를 마감할 때, 정산표 한 장과 그 숫자를 뒷받침하는 주문·입금·발송 자료를 같은 묶음에 넣어 두면 나중에 금액이 맞지 않는 곳을 바로 찾을 수 있습니다.",
    groups: [
      { id: "table", label: "정산표" },
      { id: "proof", label: "숫자를 뒷받침하는 자료" },
    ],
    items: [
      { id: "sheet", group: "table", name: "정산표(CSV·엑셀)", file: "정산표", kind: "doc", need: true, why: "날짜·구매자·품목·규격(kg)·수량·단가·판매금액·배송비·수수료·입금액을 한 줄에 한 거래씩 적은 표입니다. 정산표 점검 도구로 계산이 맞는지 먼저 확인하세요.", tip: "원본 엑셀 파일과 CSV 사본을 함께 넣어 두면 좋습니다." },
      { id: "orders", group: "proof", name: "주문·계약 내역", file: "주문내역", kind: "doc", need: true, why: "정산표 각 줄의 근거가 되는 주문서, 메시지 캡처, 계약서입니다.", tip: "정산표의 날짜·구매자와 같은 순서로 이름을 붙이면 대조가 쉽습니다." },
      { id: "bank", group: "proof", name: "입금 내역(같은 기간)", file: "입금내역", kind: "doc", need: true, readable: true, why: "정산 기간의 통장 거래내역 또는 이체 확인증입니다. 정산표의 입금액과 한 줄씩 맞춰 봅니다.", tip: "은행 앱에서 기간을 지정해 거래내역을 파일로 저장할 수 있는지 확인해 보세요." },
      { id: "shipping", group: "proof", name: "출고·발송 기록", file: "발송기록", kind: "doc", need: false, why: "운송장 목록, 출하 전표처럼 언제 무엇을 보냈는지 보여 주는 기록입니다.", tip: "택배 앱의 발송 내역 화면을 기간별로 저장해 두세요." },
      { id: "market", group: "proof", name: "공판장·위탁 정산서", file: "위탁정산서", kind: "doc", need: false, why: "공판장 경매나 위탁 판매를 했다면 받은 정산서입니다. 수수료·공제 항목을 정산표와 같은 이름으로 맞춥니다.", tip: "종이 정산서는 스캔하거나 평평하게 놓고 찍으세요." },
      { id: "costs", group: "proof", name: "비용 영수증", file: "비용영수증", kind: "doc", need: false, why: "상자·완충재 같은 포장재, 택배비, 수수료 영수증입니다. 남은 돈을 계산할 때 빠지기 쉬운 항목입니다.", tip: "영수증이 작으면 여러 장을 한 장에 모아 찍지 말고 한 장씩 남기세요." },
      { id: "refunds", group: "proof", name: "반품·환불 기록", file: "환불기록", kind: "doc", need: false, why: "환불·부분 환불 금액과 사유를 주고받은 메시지, 환불 이체 내역입니다.", tip: "정산표에서는 환불을 별도 줄이나 별도 열로 적어 판매금액과 섞이지 않게 합니다." },
    ],
  },
};

export const presetOrder = ["machinery", "produce", "settlement"];
