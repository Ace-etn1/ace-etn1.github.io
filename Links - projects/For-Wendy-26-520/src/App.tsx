import { useState } from 'react';
import { motion } from 'motion/react';
import {Heart, Sparkles, Star} from 'lucide-react';
import confetti from 'canvas-confetti';
import leg1 from './assets/leg1.jpg';
import leg2 from './assets/leg2.jpg';
import leg3 from './assets/leg3.jpg';
import leg4 from './assets/leg4.jpg';

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export default function App() {
  const [isFlipped, setIsFlipped] = useState(false);
  const [result, setResult] = useState<{ rarity: '普通' | '稀有' | '传奇' | 'SSSR'; text: string } | null>(null);
  const [isDrawingDisabled, setIsDrawingDisabled] = useState(false);

  const OrdinaryLines = [
    "我就说怎么手上突然多了双筷子，原来是看到我的菜了。",
    "马铃薯可以变成马铃薯泥，玉米可以变成玉米泥，我可以变成我爱泥。",
    "你喝过最好喝的酒是什么？我和你的天长地久。",
    "昨晚没睡好，因为被子太轻，压不住我想你的心。",
    "现在是几点？是我们幸福的起点。",
    "我很想晒黑，这样才能暗中保护你。",
    "你知道你跟星星有什么差别吗？星星在天上，你在我心上。",
    "我想你的时候，世界会落下一粒沙，从此有了撒哈拉。",
    "今天去了一个岛，被你迷得神魂颠倒。",
    "我就说元素周期表怎么少了三个元素，原来镁铝在这里，我的锌也在这里。",
    "我是九你是三，除了你还是你。",
    "如果你是拿破仑，那我就是滑铁卢，让你栽在我的心上。",
    "我最近在学英文，最喜欢一个单词叫 emo，我e直在背后momo的想你。",
    "我觉得我有毒，没有你的夜里孤独。",
    "有一条路叫做“啊伊喜爹路”。",
    "我买了个钟，对你的情有独钟。",
    "今天吃了泡面、吃了炒面，还是想走进你的心里面。",
    "我说怎么一直拉肚子，原来是想你的一便又一便。",
    "莫文蔚的阴天，孙燕姿的雨天，周杰伦的晴天，都不如你和我聊天。",
    "你是我的181秒，因为喜欢你不是三分钟热度。",
    "世界上有三种尺，直尺，三角尺，还有一种 love you so much。",
    "我游泳游到一座岛，对你的神魂颠倒。",
    "26个英文字母哪个最好看？是U。"
  ];

  const RareLines = [
    "我希望逢着，一个丁香一样地，结着愁怨的姑娘。——戴望舒《雨巷》",
    "你是一树一树的花开，是燕在梁间呢喃，——你是爱，是暖，是希望，你是人间的四月天！——林楹因《你是人间的四月天》",
    "我必须是你近旁的一株木棉，作为树的形象和你站在一起。——舒婷《致橡树》",
    "如何让你遇见我，在我最美丽的时刻，为这，我已在佛前求了五百年。——席慕蓉《一棵开花的树》",
    "步雨后的红莲，翩翩，你走来，像一首小令，从一则爱情的典故里你走来。——余光中《等你，在雨中》",
    "你看我时很远，你看云时很近。——顾城《远和近》",
    "从前的日色变得慢，车，马，邮件都慢，一生只够爱一个人。——木心《从前慢》",
    "草在结它的种子，风在摇它的叶子，我们站着，不说话，就十分美好。——顾城《门前》",
    "远在远方的风，比远方更远。——海子《九月》",
    "我们准备着深深地领受，那些意想不到的奇迹，在漫长的岁月里忽然有，彗星的出现，狂风乍起。——冯至《十四行集·其二十七》"
  ];


  const LegendaryData = [
    { url: leg1, quote: "风吹过无垠草原，悄悄带起你的秀发" },
    { url: leg2, quote: "油烟机低声运转，夜晚被你的温柔点亮" },
    { url: leg3, quote: "喧嚣与沉醉过后，愿回忆一如既往" },
    { url: leg4, quote: "海浪轻拥海岸，我们学习着如何拥抱" }
  ];

  const formatCardText = (text: string) => {
    // 1. Separate signature if present (using 破折号)
    let body = text;
    let signature = "";
    if (text.includes("——")) {
      const split = text.split("——");
      body = split[0];
      signature = split[1];
    }

    // 2. Format Body (split at 逗号，if preceding part is >= 5 chars)
    const lines: string[] = [];
    let currentLine = "";
    const segments = body.split("，");
    
    for(let i=0; i<segments.length; i++) {
        let seg = segments[i];
        if (i < segments.length - 1) seg += "，";
        
        if (currentLine.length >= 5) {
            lines.push(currentLine);
            currentLine = seg;
        } else {
            currentLine += seg;
        }
    }
    lines.push(currentLine);

    return (
        <div className="flex flex-col items-center">
            {lines.map((line, i) => <div key={i}>{line}</div>)}
            {signature && <div className="mt-4 text-sm opacity-70">——{signature}</div>}
        </div>
    );
  }

  const handleDraw = () => {
    if (isDrawingDisabled) return;
    
    const getResult = () => {
        const r = Math.random();
        if (r < 0.69) {
          const randomIndex = Math.floor(Math.random() * OrdinaryLines.length);
          return { rarity: '普通' as const, text: OrdinaryLines[randomIndex] };
        }
        if (r < 0.89) {
          const randomIndex = Math.floor(Math.random() * RareLines.length);
          return { rarity: '稀有' as const, text: RareLines[randomIndex] };
        }
        if (r < 0.97) {
          const randomIndex = Math.floor(Math.random() * LegendaryData.length);
          return { rarity: '传奇' as const, text: JSON.stringify(LegendaryData[randomIndex]) };
        }
        return { rarity: 'SSSR' as const, text: '❤520快乐❤' };
    };

    const triggerFireworks = () => {
        setIsDrawingDisabled(true);
        confetti({
            particleCount: 150,
            spread: 70,
            origin: { y: 0.6 }
        });
        setTimeout(() => {
            setIsDrawingDisabled(false);
        }, 2000);
    }
    
    if (isFlipped) {
      setIsFlipped(false);
      setTimeout(() => {
        const res = getResult();
        setResult(res);
        setIsFlipped(true);
        if (res.rarity === 'SSSR') triggerFireworks();
      }, 300);
    } else {
      const res = getResult();
      setResult(res);
      setIsFlipped(true);
      if (res.rarity === 'SSSR') triggerFireworks();
    }
  };

  return (
    <div id="app-container" className="min-h-screen w-full bg-[#fff0f5] flex items-center justify-center relative overflow-hidden font-sans p-4">
      {/* Background blurs */}
      <div className="absolute top-[-10%] left-[-10%] w-[400px] h-[400px] bg-[#ffb6c1] rounded-full blur-[100px] opacity-40"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-[#ff69b4] rounded-full blur-[120px] opacity-30"></div>
      <div className="absolute top-1/4 right-10 w-[200px] h-[200px] bg-[#db7093] rounded-full blur-[80px] opacity-20"></div>

      {/* Decorative drawings */}
      <Heart className="absolute top-[10%] left-[15%] text-[#ff69b4] opacity-30 rotate-12" size={64} />
      <Sparkles className="absolute top-[20%] right-[20%] text-[#db7093] opacity-20 -rotate-12" size={48} />
      <Heart className="absolute bottom-[20%] left-[20%] text-[#db7093] opacity-20 -rotate-6" size={80} />
      <Sparkles className="absolute bottom-[10%] right-[10%] text-[#ff69b4] opacity-30 rotate-6" size={56} />
      <Star className="absolute top-[15%] right-[10%] text-[#ff69b4] opacity-20 rotate-45" size={40} />
      <Star className="absolute bottom-[30%] right-[15%] text-[#db7093] opacity-20" size={32} />
      <Heart className="absolute top-[40%] left-[5%] text-[#ff69b4] opacity-20 rotate-[-15deg]" size={48} />

      {/* Main Card */}
      <div id="main-card" className="z-10 w-[95%] max-w-6xl h-[85vh] backdrop-blur-xl bg-white/40 border border-white/60 rounded-[40px] shadow-2xl p-6 md:p-12 text-center flex flex-col items-center justify-start pt-8 md:pt-16">
        <h1 id="main-title" className="text-3xl sm:text-5xl md:text-7xl font-cartoony font-bold text-[#db7093] mb-2 md:mb-4 tracking-widest w-full max-w-4xl" style={{textShadow: "2px 2px 4px rgba(219, 112, 147, 0.2)"}}>
          致Wendy公主
        </h1>

        {/* Compliments Engine Section */}
        <div id="compliments-engine" className="flex flex-col items-center w-full mt-2 md:mt-4 flex-1 justify-between py-4 md:py-8">
          {/* Deck of Cards - visual stack */}
          <div className="relative w-[min(90vw,34rem)] h-[min(70vw,28rem)] mt-2 md:mt-4 perspective-1000">
            {/* Bottommost card */}
            <div className="absolute top-3 left-3 w-full h-full bg-white/30 border border-white/50 rounded-3xl shadow-sm rotate-[-3deg]"></div>
            {/* Middle card */}
            <div className="absolute top-1.5 left-1.5 w-full h-full bg-white/50 border border-white/50 rounded-3xl shadow-sm rotate-[1deg]"></div>
            
            {/* Topmost card (Flipping) */}
            <motion.div 
                className="absolute w-full h-full cursor-pointer"
                animate={{ rotateY: isFlipped ? 180 : 0 }}
                transition={{ duration: 0.6, type: "spring", stiffness: 200, damping: 20 }}
                style={{ transformStyle: 'preserve-3d' }}
            >
                {/* Back side */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/90 to-pink-100/80 border-4 border-white rounded-3xl shadow-xl flex items-center justify-center backface-hidden">
                    <Heart className="text-pink-400 opacity-50 w-20 h-20 md:w-32 md:h-32" fill="currentColor" />
                </div>
                
                {/* Front side */}
                <div className="absolute inset-0 bg-white border-4 border-[#db7093]/20 rounded-3xl shadow-xl flex flex-col items-center justify-center backface-hidden rotate-y-180 p-4 md:p-8">
                    <Sparkles className="absolute top-4 left-4 md:top-6 md:left-6 text-pink-300 w-6 h-6 md:w-8 md:h-8" />
                    <Star className="absolute top-4 right-4 md:top-6 md:right-6 text-yellow-300 w-6 h-6 md:w-8 md:h-8" />
                    <Heart className="absolute bottom-4 left-4 md:bottom-6 md:left-6 text-red-300 w-6 h-6 md:w-8 md:h-8" />
                    <Sparkles className="absolute bottom-4 right-4 md:bottom-6 md:right-6 text-pink-300 w-6 h-6 md:w-8 md:h-8" />
                    
                    <p className="absolute top-6 md:top-12 text-sm md:text-xl font-cartoony text-[#db7093]/70 font-bold uppercase tracking-widest">
                      {result?.rarity}
                    </p>
                    <div className={`${result?.rarity === '普通' || result?.rarity === '稀有' ? 'text-lg md:text-xl' : 'text-3xl md:text-6xl'} font-cartoony font-bold text-[#db7093] px-2 md:px-4`}>
                      {(result?.rarity === '普通' || result?.rarity === '稀有') ? (
                        formatCardText(result.text)
                      ) : result?.rarity === '传奇' ? (
                        <div className="flex flex-col items-center">
                            <img src={JSON.parse(result.text).url} className="aspect-[3/2] w-2/3 md:w-1/2 object-cover rounded-xl" alt="legendary" />
                            <p className="text-sm md:text-xl mt-2 md:mt-4 font-normal">{JSON.parse(result.text).quote}</p>
                        </div>
                      ) : (
                        `${result?.text}!`
                      )}
                    </div>
                </div>
            </motion.div>
          </div>

          {/* Button */}
          <button 
            onClick={handleDraw}
            disabled={isDrawingDisabled}
            className={`px-8 py-3 md:px-12 md:py-6 bg-[#db7093] text-white font-cartoony rounded-2xl text-lg md:text-2xl shadow-lg hover:bg-[#c26182] transition-colors cursor-pointer mt-4 ${isDrawingDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isFlipped ? "再抽一次" : "抽一次"}
          </button>
        </div>
      </div>
    </div>
  );
}
