const friendlyReplacements: Array<[RegExp, string]> = [
  [/간식\s*급여를/g, '간식을 주는 것을'],
  [/간식\s*급여/g, '간식을 주는 것'],
  [/사료\s*급여를/g, '사료를 먹이는 것을'],
  [/사료\s*급여/g, '사료를 먹이는 것'],
  [/급여\s*횟수/g, '식사 횟수'],
  [/급여량/g, '식사량'],
  [/급여\s*시간/g, '식사 시간'],
  [/급여\s*방법/g, '식사를 챙기는 방법'],
  [/급여\s*형태/g, '먹이고 있는 사료 형태'],
  [/급여해\s*주세요/g, '식사를 챙겨주세요'],
  [/급여하세요/g, '식사를 챙겨주세요'],
  [/급여하십시오/g, '식사를 챙겨주세요'],
  [/급여하고/g, '식사를 챙기고'],
  [/급여할\s*때/g, '먹일 때'],
  [/급여\s*시/g, '먹일 때'],
  [/급여\s*전/g, '먹이기 전'],
  [/급여\s*후/g, '먹인 후'],
  [/급여하는/g, '먹이는'],
  [/급여한/g, '먹인'],
  [/급여를/g, '먹이는 것을'],
  [/급여는/g, '먹이는 것은'],
  [/급여가/g, '먹이는 것이'],
  [/급여도/g, '먹이는 것도'],
  [/급여로/g, '식사로'],
  [/급여/g, '식사'],
]

export function makeFoodCopyFriendly(text: string) {
  return friendlyReplacements.reduce(
    (friendlyText, [pattern, replacement]) => friendlyText.replace(pattern, replacement),
    text,
  )
}
