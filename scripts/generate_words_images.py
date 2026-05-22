"""Expand word JSON files and generate illustration PNGs for each word."""
from __future__ import annotations

import json
import re
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "src" / "data"
IMG_DIR = ROOT / "public" / "images" / "words"

EMOJI = {
    "apple": "🍎", "book": "📚", "school": "🏫", "friend": "👫", "happy": "😊",
    "study": "📖", "teacher": "👩‍🏫", "water": "💧", "family": "👨‍👩‍👧", "beautiful": "🌸",
    "breakfast": "🍳", "weather": "🌤️", "music": "🎵", "garden": "🌻", "animal": "🐾",
    "travel": "✈️", "healthy": "💪", "important": "⭐", "practice": "🎯", "remember": "🧠",
    "different": "🔄", "together": "🤝", "favorite": "❤️", "question": "❓", "answer": "💬",
    "morning": "🌅", "evening": "🌆", "holiday": "🎉", "present": "🎁", "future": "🔮",
    "student": "🎒", "library": "📚", "computer": "💻", "phone": "📱", "movie": "🎬",
    "sport": "⚽", "summer": "☀️", "winter": "❄️", "spring": "🌷", "autumn": "🍂",
    "city": "🏙️", "country": "🌍", "river": "🏞️", "mountain": "⛰️", "beach": "🏖️",
    "food": "🍽️", "coffee": "☕", "bread": "🍞", "milk": "🥛", "vegetable": "🥗",
    "hospital": "🏥", "police": "👮", "fire": "🔥", "rain": "🌧️", "snow": "🌨️",
    "bus": "🚌", "train": "🚆", "bicycle": "🚲", "car": "🚗", "airport": "🛫",
    "money": "💰", "market": "🛒", "clothes": "👕", "shoes": "👟", "hat": "🧢",
    "dog": "🐕", "cat": "🐈", "bird": "🐦", "fish": "🐟", "flower": "💐",
    "tree": "🌳", "cloud": "☁️", "star": "⭐", "moon": "🌙", "sun": "☀️",
    "hello": "👋", "thank you": "🙏", "sorry": "😔", "please": "🙏", "goodbye": "👋",
    "menu": "📋", "help": "🆘", "delicious": "😋", "bathroom": "🚻", "emergency": "🚨",
    "accomplish": "🏆", "beneficial": "✅", "environment": "🌿", "technology": "💡",
    "education": "🎓", "experience": "📋", "opportunity": "🚪", "communication": "📡",
    "development": "📈", "government": "🏛️", "population": "👥", "tradition": "🎎",
    "culture": "🎭", "economy": "📊", "research": "🔬", "solution": "💡",
    "challenge": "🧗", "creative": "🎨", "confidence": "💪", "responsibility": "📌",
}

GRADIENTS = [
    ((99, 102, 241), (129, 140, 248)),
    ((79, 70, 229), (167, 139, 250)),
    ((14, 165, 233), (56, 189, 248)),
    ((16, 185, 129), (52, 211, 153)),
    ((245, 158, 11), (251, 191, 36)),
    ((236, 72, 153), (244, 114, 182)),
]


def slug(word: str) -> str:
    s = word.lower().strip()
    s = re.sub(r"[^a-z0-9]+", "-", s)
    return s.strip("-") or "word"


def pick_emoji(word: str) -> str:
    key = word.lower().strip()
    if key in EMOJI:
        return EMOJI[key]
    for part in key.split():
        if part in EMOJI:
            return EMOJI[part]
    return "📘"


def load_font(size: int) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    for path in (
        "C:/Windows/Fonts/seguiemj.ttf",
        "C:/Windows/Fonts/segoeui.ttf",
        "C:/Windows/Fonts/arial.ttf",
    ):
        if Path(path).exists():
            try:
                return ImageFont.truetype(path, size)
            except OSError:
                continue
    return ImageFont.load_default()


def make_image(word: str, out_path: Path, index: int) -> None:
    w, h = 480, 320
    g0, g1 = GRADIENTS[index % len(GRADIENTS)]
    img = Image.new("RGB", (w, h))
    draw = ImageDraw.Draw(img)
    for y in range(h):
        t = y / h
        r = int(g0[0] + (g1[0] - g0[0]) * t)
        g = int(g0[1] + (g1[1] - g0[1]) * t)
        b = int(g0[2] + (g1[2] - g0[2]) * t)
        draw.line([(0, y), (w, y)], fill=(r, g, b))

    emoji = pick_emoji(word)
    ef = load_font(120)
    bbox = draw.textbbox((0, 0), emoji, font=ef)
    tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
    draw.text(((w - tw) // 2, (h - th) // 2 - 20), emoji, font=ef, embedded_color=True)

    wf = load_font(22)
    label = word[:28]
    bb = draw.textbbox((0, 0), label, font=wf)
    lw = bb[2] - bb[0]
    draw.text(((w - lw) // 2, h - 48), label, font=wf, fill=(255, 255, 255))

    out_path.parent.mkdir(parents=True, exist_ok=True)
    img.save(out_path, "PNG", optimize=True)


def enrich(words: list[dict], level: str) -> list[dict]:
    result = []
    for i, item in enumerate(words):
        s = slug(item["word"])
        image = f"/images/words/{s}.png"
        make_image(item["word"], IMG_DIR / f"{s}.png", i)
        result.append({**item, "image": image})
    out = DATA / {"middle": "middleSchool.json", "high": "highSchool.json", "daily": "dailyConversation.json"}[level]
    out.write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Wrote {len(result)} words -> {out.name}")
    return result


# --- word lists (word, meaning, example, exampleKo) ---
MIDDLE = [
    ("apple", "사과", "I eat an apple every morning.", "나는 매일 아침 사과를 먹는다."),
    ("book", "책", "She is reading a book in the library.", "그녀는 도서관에서 책을 읽고 있다."),
    ("school", "학교", "We go to school at eight o'clock.", "우리는 8시에 학교에 간다."),
    ("friend", "친구", "He is my best friend.", "그는 나의 가장 친한 친구이다."),
    ("happy", "행복한", "I feel happy when I see my family.", "가족을 보면 행복하다."),
    ("study", "공부하다", "Students study English every day.", "학생들은 매일 영어를 공부한다."),
    ("teacher", "선생님", "Our teacher explains the lesson clearly.", "선생님이 수업을 명확히 설명한다."),
    ("water", "물", "Please drink more water.", "물을 더 많이 마시세요."),
    ("family", "가족", "My family loves to travel together.", "우리 가족은 함께 여행하는 것을 좋아한다."),
    ("beautiful", "아름다운", "The sunset is beautiful tonight.", "오늘 밤 노을이 아름답다."),
    ("breakfast", "아침 식사", "I had eggs for breakfast.", "아침으로 달걀을 먹었다."),
    ("weather", "날씨", "The weather is sunny today.", "오늘 날씨가 맑다."),
    ("music", "음악", "She listens to music while studying.", "그녀는 공부하면서 음악을 듣는다."),
    ("garden", "정원", "There are many flowers in the garden.", "정원에 꽃이 많이 있다."),
    ("animal", "동물", "The zoo has many kinds of animals.", "동물원에는 여러 동물이 있다."),
    ("travel", "여행하다", "We will travel to Jeju Island.", "우리는 제주도로 여행할 것이다."),
    ("healthy", "건강한", "Eating vegetables keeps you healthy.", "채소를 먹으면 건강해진다."),
    ("important", "중요한", "Sleep is important for your health.", "수면은 건강에 중요하다."),
    ("practice", "연습하다", "You should practice speaking English.", "영어 말하기를 연습해야 한다."),
    ("remember", "기억하다", "Please remember to bring your homework.", "숙제를 가져오는 것을 기억하세요."),
    ("different", "다른", "These two pictures look different.", "이 두 사진은 다르게 보인다."),
    ("together", "함께", "Let's work together on this project.", "이 프로젝트를 함께 하자."),
    ("favorite", "가장 좋아하는", "Blue is my favorite color.", "파란색이 내가 가장 좋아하는 색이다."),
    ("question", "질문", "Do you have any questions?", "질문이 있나요?"),
    ("answer", "대답하다", "Please answer the question loudly.", "질문에 크게 대답해 주세요."),
    ("morning", "아침", "I exercise every morning.", "나는 매일 아침 운동한다."),
    ("evening", "저녁", "We watch TV in the evening.", "우리는 저녁에 TV를 본다."),
    ("holiday", "휴일", "Monday is a national holiday.", "월요일은 공휴일이다."),
    ("present", "선물", "I bought a present for my mother.", "어머니를 위해 선물을 샀다."),
    ("future", "미래", "I want to be a doctor in the future.", "나는 미래에 의사가 되고 싶다."),
    ("student", "학생", "Every student has a locker.", "모든 학생에게 사물함이 있다."),
    ("library", "도서관", "Please be quiet in the library.", "도서관에서는 조용히 해 주세요."),
    ("computer", "컴퓨터", "I use a computer for homework.", "숙제를 하려고 컴퓨터를 쓴다."),
    ("phone", "전화", "My phone battery is low.", "휴대폰 배터리가 거의 없다."),
    ("movie", "영화", "We watched a funny movie.", "우리는 재미있는 영화를 봤다."),
    ("sport", "운동", "Soccer is my favorite sport.", "축구는 내가 가장 좋아하는 운동이다."),
    ("summer", "여름", "We go swimming in summer.", "우리는 여름에 수영을 한다."),
    ("winter", "겨울", "It snows a lot in winter.", "겨울에는 눈이 많이 온다."),
    ("spring", "봄", "Flowers bloom in spring.", "봄에 꽃이 핀다."),
    ("autumn", "가을", "Leaves turn red in autumn.", "가을에 잎이 빨갛게 물든다."),
    ("city", "도시", "Seoul is a big city.", "서울은 큰 도시이다."),
    ("country", "나라", "Korea is a beautiful country.", "한국은 아름다운 나라이다."),
    ("river", "강", "Children play near the river.", "아이들이 강가에서 논다."),
    ("mountain", "산", "We climbed the mountain.", "우리는 산을 올랐다."),
    ("beach", "해변", "Let's go to the beach.", "해변에 가자."),
    ("food", "음식", "Korean food is delicious.", "한국 음식은 맛있다."),
    ("coffee", "커피", "She drinks coffee every morning.", "그녀는 매일 아침 커피를 마신다."),
    ("bread", "빵", "I bought fresh bread.", "나는 갓 구운 빵을 샀다."),
    ("milk", "우유", "Milk is good for your bones.", "우유는 뼈에 좋다."),
    ("vegetable", "채소", "Eat more vegetables every day.", "매일 채소를 더 많이 먹어라."),
    ("hospital", "병원", "He went to the hospital.", "그는 병원에 갔다."),
    ("bus", "버스", "Take the bus to school.", "학교까지 버스를 타."),
    ("train", "기차", "The train arrives at noon.", "기차는 정오에 도착한다."),
    ("bicycle", "자전거", "I ride my bicycle to the park.", "공원까지 자전거를 탄다."),
    ("car", "자동차", "My father drives a red car.", "아버지는 빨간 차를 운전한다."),
    ("money", "돈", "Save money for the future.", "미래를 위해 돈을 모아라."),
    ("market", "시장", "We buy fruit at the market.", "시장에서 과일을 산다."),
    ("clothes", "옷", "She bought new clothes.", "그녀는 새 옷을 샀다."),
    ("dog", "개", "The dog is very friendly.", "그 개는 매우 친절하다."),
    ("cat", "고양이", "The cat sleeps on the sofa.", "고양이가 소파에서 잔다."),
    ("bird", "새", "A bird is singing outside.", "밖에서 새가 노래한다."),
    ("fish", "물고기", "We saw fish in the aquarium.", "수족관에서 물고기를 봤다."),
    ("flower", "꽃", "She received a flower.", "그녀는 꽃을 받았다."),
    ("tree", "나무", "There is a tall tree.", "키 큰 나무가 있다."),
    ("cloud", "구름", "White clouds fill the sky.", "하늘에 흰 구름이 가득하다."),
    ("star", "별", "Stars shine at night.", "밤에 별이 빛난다."),
    ("moon", "달", "The moon is bright tonight.", "오늘 밤 달이 밝다."),
    ("sun", "태양", "The sun rises in the east.", "태양은 동쪽에서 뜬다."),
]

HIGH = [
    ("accomplish", "성취하다", "She accomplished her goal through hard work.", "그녀는 노력으로 목표를 성취했다."),
    ("ambiguous", "애매한", "The instructions were ambiguous.", "지시가 애매했다."),
    ("beneficial", "유익한", "Exercise is beneficial to your health.", "운동은 건강에 유익하다."),
    ("comprehensive", "포괄적인", "The report is comprehensive.", "보고서가 포괄적이다."),
    ("deteriorate", "악화되다", "His health began to deteriorate.", "그의 건강이 악화되기 시작했다."),
    ("elaborate", "자세히 설명하다", "Could you elaborate on your idea?", "아이디어를 자세히 설명해 주시겠어요?"),
    ("facilitate", "촉진하다", "Technology facilitates communication.", "기술은 소통을 촉진한다."),
    ("hypothesis", "가설", "Scientists tested their hypothesis.", "과학자들이 가설을 검증했다."),
    ("inevitable", "불가피한", "Change is inevitable.", "변화는 불가피하다."),
    ("justify", "정당화하다", "He tried to justify his decision.", "그는 결정을 정당화하려 했다."),
    ("legitimate", "정당한", "They raised a legitimate concern.", "정당한 우려를 제기했다."),
    ("magnificent", "웅장한", "The palace was magnificent.", "궁전이 웅장했다."),
    ("nevertheless", "그럼에도", "It was raining; nevertheless we went out.", "비가 왔지만 나갔다."),
    ("obstacle", "장애물", "Lack of funding was an obstacle.", "자금 부족이 장애물이었다."),
    ("phenomenon", "현상", "Climate change is a global phenomenon.", "기후 변화는 전 지구적 현상이다."),
    ("reluctant", "꺼리는", "She was reluctant to accept.", "그녀는 받아들이기를 꺼렸다."),
    ("substantial", "상당한", "They made substantial progress.", "상당한 진전을 이뤘다."),
    ("tremendous", "엄청난", "It was a tremendous success.", "엄청난 성공이었다."),
    ("unprecedented", "전례 없는", "The growth was unprecedented.", "성장이 전례 없었다."),
    ("vulnerable", "취약한", "Children are vulnerable online.", "아이들은 온라인에 취약하다."),
    ("widespread", "광범위한", "There is widespread support.", "광범위한 지지가 있다."),
    ("acknowledge", "인정하다", "He acknowledged his mistake.", "그는 실수를 인정했다."),
    ("controversy", "논란", "The policy caused controversy.", "정책이 논란을 일으켰다."),
    ("demonstrate", "증명하다", "The test will demonstrate the theory.", "실험이 이론을 증명할 것이다."),
    ("emphasize", "강조하다", "The teacher emphasized key points.", "선생님이 핵심을 강조했다."),
    ("fundamental", "근본적인", "Trust is fundamental.", "신뢰는 근본적이다."),
    ("implement", "시행하다", "The school will implement a new program.", "학교가 새 프로그램을 시행한다."),
    ("perspective", "관점", "See it from her perspective.", "그녀의 관점에서 봐라."),
    ("significant", "중요한", "This is a significant discovery.", "중요한 발견이다."),
    ("sustainable", "지속 가능한", "We need sustainable energy.", "지속 가능한 에너지가 필요하다."),
    ("environment", "환경", "Protect the environment.", "환경을 보호하라."),
    ("technology", "기술", "Technology changes quickly.", "기술은 빠르게 변한다."),
    ("education", "교육", "Education opens many doors.", "교육은 많은 문을 연다."),
    ("experience", "경험", "Travel gives great experience.", "여행은 좋은 경험을 준다."),
    ("opportunity", "기회", "Don't miss this opportunity.", "이 기회를 놓치지 마라."),
    ("communication", "의사소통", "Good communication builds trust.", "좋은 소통은 신뢰를 쌓는다."),
    ("development", "발전", "Economic development takes time.", "경제 발전에는 시간이 걸린다."),
    ("government", "정부", "The government announced a plan.", "정부가 계획을 발표했다."),
    ("population", "인구", "The population is growing.", "인구가 증가하고 있다."),
    ("tradition", "전통", "We respect our tradition.", "우리는 전통을 존중한다."),
    ("culture", "문화", "Korean culture is popular worldwide.", "한국 문화가 전 세계적으로 인기다."),
    ("economy", "경제", "The economy is recovering.", "경제가 회복되고 있다."),
    ("research", "연구", "She does cancer research.", "그녀는 암 연구를 한다."),
    ("solution", "해결책", "We need a practical solution.", "실용적인 해결책이 필요하다."),
    ("challenge", "도전", "Accept the challenge.", "도전을 받아들여라."),
    ("creative", "창의적인", "Be creative with your ideas.", "아이디어에 창의적으로."),
    ("confidence", "자신감", "Practice builds confidence.", "연습이 자신감을 키운다."),
    ("responsibility", "책임", "It is your responsibility.", "그것은 네 책임이다."),
    ("analyze", "분석하다", "Scientists analyze the data.", "과학자들이 데이터를 분석한다."),
    ("contribute", "기여하다", "Everyone can contribute.", "모두가 기여할 수 있다."),
    ("distinguish", "구별하다", "Can you distinguish the two?", "둘을 구별할 수 있나?"),
    ("encounter", "마주치다", "We encountered a problem.", "문제를 마주쳤다."),
    ("fluctuate", "변동하다", "Prices fluctuate daily.", "가격이 매일 변동한다."),
    ("generate", "생성하다", "Wind turbines generate power.", "풍력 터빈이 전력을 생산한다."),
    ("hesitate", "망설이다", "Don't hesitate to ask.", "질문을 망설이지 마라."),
    ("illustrate", "설명하다", "This chart illustrates the trend.", "이 차트가 추세를 보여준다."),
    ("maintain", "유지하다", "Maintain a healthy diet.", "건강한 식단을 유지하라."),
    ("negotiate", "협상하다", "They negotiate the contract.", "그들은 계약을 협상한다."),
    ("observe", "관찰하다", "Observe nature carefully.", "자연을 주의 깊게 관찰하라."),
    ("pursue", "추구하다", "Pursue your dreams.", "꿈을 추구하라."),
    ("relevant", "관련 있는", "That comment is not relevant.", "그 발언은 관련이 없다."),
    ("strategy", "전략", "We need a new strategy.", "새 전략이 필요하다."),
    ("undergo", "겪다", "The city underwent changes.", "도시가 변화를 겪었다."),
    ("virtually", "사실상", "Virtually everyone agreed.", "사실상 모두 동의했다."),
]

DAILY = [
    ("hello", "안녕하세요", "Hello! How are you today?", "안녕하세요! 오늘 어떠세요?"),
    ("thank you", "감사합니다", "Thank you for your help.", "도와주셔서 감사합니다."),
    ("excuse me", "실례합니다", "Excuse me, where is the station?", "실례합니다, 역이 어디예요?"),
    ("sorry", "미안합니다", "I'm sorry for being late.", "늦어서 미안합니다."),
    ("please", "부탁합니다", "Could you please open the window?", "창문을 열어 주시겠어요?"),
    ("goodbye", "안녕히 가세요", "Goodbye! See you tomorrow.", "안녕히 가세요! 내일 봐요."),
    ("how much", "얼마예요", "How much is this shirt?", "이 셔츠는 얼마예요?"),
    ("where", "어디", "Where is the nearest restroom?", "가장 가까운 화장실이 어디예요?"),
    ("when", "언제", "When does the bus arrive?", "버스는 언제 도착하나요?"),
    ("I don't understand", "이해가 안 돼요", "I don't understand. Can you repeat?", "이해가 안 돼요. 다시 말씀해 주세요."),
    ("help", "도움", "I need help with my luggage.", "짐을 옮기는 데 도움이 필요해요."),
    ("menu", "메뉴", "Can I see the menu, please?", "메뉴 좀 볼 수 있을까요?"),
    ("reservation", "예약", "I have a reservation under Kim.", "김으로 예약했습니다."),
    ("delicious", "맛있는", "This soup is really delicious!", "이 수프 정말 맛있어요!"),
    ("bathroom", "화장실", "May I use the bathroom?", "화장실을 써도 될까요?"),
    ("appointment", "약속", "I have an appointment at three.", "3시에 약속이 있어요."),
    ("direction", "방향", "Can you give me directions?", "길을 알려 주시겠어요?"),
    ("recommend", "추천하다", "What do you recommend?", "뭘 추천하세요?"),
    ("allergy", "알레르기", "I have a peanut allergy.", "땅콩 알레르기가 있어요."),
    ("emergency", "응급", "Call emergency services.", "응급 서비스에 전화하세요."),
    ("lost", "길을 잃은", "I think I'm lost.", "길을 잃은 것 같아요."),
    ("nice to meet you", "만나서 반갑습니다", "Nice to meet you. I'm Minho.", "만나서 반갑습니다. 민호입니다."),
    ("see you later", "나중에 봐요", "See you later at the café.", "카페에서 나중에 봐요."),
    ("no problem", "문제없어요", "No problem. I can wait.", "문제없어요. 기다릴 수 있어요."),
    ("of course", "물론이죠", "Of course, you can borrow my pen.", "물론, 제 펜을 빌려 드릴게요."),
    ("just a moment", "잠시만요", "Just a moment, please.", "잠시만 기다려 주세요."),
    ("repeat", "반복하다", "Could you repeat that slowly?", "더 천천히 다시 말씀해 주세요."),
    ("check please", "계산서 주세요", "Check please. We are ready to pay.", "계산서 주세요. 결제할게요."),
    ("takeaway", "포장", "Is this for here or takeaway?", "여기서 드시나요, 포장인가요?"),
    ("cash or card", "현금인가요 카드인가요", "Will you pay by cash or card?", "현금인가요, 카드인가요?"),
    ("how are you", "어떻게 지내세요", "How are you doing today?", "오늘 어떻게 지내세요?"),
    ("my name is", "제 이름은", "My name is Jisu. Nice to meet you.", "제 이름은 지수예요. 만나서 반가워요."),
    ("I would like", "원합니다", "I would like a glass of water.", "물 한 잔 주세요."),
    ("how long", "얼마나 걸리나요", "How long does it take?", "얼마나 걸리나요?"),
    ("too expensive", "너무 비싸요", "That is too expensive for me.", "저에게는 너무 비싸요."),
    ("discount", "할인", "Is there a discount today?", "오늘 할인 있나요?"),
    ("receipt", "영수증", "Can I have a receipt?", "영수증 주시겠어요?"),
    ("open", "열다", "What time do you open?", "몇 시에 여나요?"),
    ("closed", "닫힌", "The store is closed on Sundays.", "가게는 일요일에 닫아요."),
    ("traffic", "교통", "There is a lot of traffic today.", "오늘 교통이 많이 막혀요."),
    ("forecast", "일기예보", "What is the weather forecast?", "일기예보가 어떻게 되나요?"),
    ("photo", "사진", "May I take a photo here?", "여기서 사진 찍어도 되나요?"),
    ("wifi", "와이파이", "What is the WiFi password?", "와이파이 비밀번호가 뭐예요?"),
    ("charger", "충전기", "Do you have a phone charger?", "휴대폰 충전기 있나요?"),
    ("pharmacy", "약국", "Where is the nearest pharmacy?", "가장 가까운 약국이 어디예요?"),
    ("ticket", "표", "I need a ticket to Busan.", "부산행 표가 필요해요."),
    ("platform", "승강장", "Which platform is the train?", "기차는 어느 승강장이에요?"),
    ("seat", "좌석", "Is this seat available?", "이 좌석 비었나요?"),
    ("breakfast included", "조식 포함", "Is breakfast included?", "조식이 포함되나요?"),
    ("checkout", "체크아웃", "What time is checkout?", "체크아웃이 몇 시예요?"),
    ("call me", "전화해 주세요", "Please call me later.", "나중에 전화해 주세요."),
    ("I am looking for", "찾고 있어요", "I am looking for my bag.", "가방을 찾고 있어요."),
]


def to_dicts(items: list[tuple]) -> list[dict]:
    return [
        {"word": w, "meaning": m, "example": e, "exampleKo": k}
        for w, m, e, k in items
    ]


def main() -> None:
    IMG_DIR.mkdir(parents=True, exist_ok=True)
    enrich(to_dicts(MIDDLE), "middle")
    enrich(to_dicts(HIGH), "high")
    enrich(to_dicts(DAILY), "daily")
    print("Done.")


if __name__ == "__main__":
    main()
