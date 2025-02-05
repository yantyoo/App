// 동기 코드
// 순차적으로 코드가 진행되는 것을 의미미

const x = double(100)
const y = x

function double(props) {
    return props * 2
}

// 4라인 코드 실행 후 -> 5번째 라인 코드 실행
// 앞에 코드가 완료되기 전에 뒤에 코드를 실행할 수 없음 // 관계성이 있고 종속성이 있음

// 비동기 코드
// 앞에 코드가 완료되지 않아도 다음 코드를 실행시킬 수 있는 상태
// 자바스크립트에서 정상적으로 비동기 코드를 만들어 낼 수 없음

function sum(a, b) {
    setTimeout(() => {
        return a + b
    }, 1000)
}

const result = sum(100, 200)
const z = result
console.log(z);  // undefined
// 위에 값이 undefined가 출력 되는 이유는 return 시킨 값을 받지 못했기 때문
// why? setTimeout으로 순차적으로 코드가 흐로도록 하지 않음
// callback를 사용하여 해결

function sum2(a, b, cb) {
    setTimeout(() => {
        cb(a + b)
    }, 1000)
}

const result2 = sum2(100, 200, (res) => {
    console.log(res);  // 1초 뒤 출력
})
const z2 = result2
console.log(z2);  // undefined

// --------------------------------------------

const result3 = new Promise((resolve, reject) => {
    // resolve 함수 Promise 내부에서 동작하는 작업이 성공 했을 경우 동작
    resolve("성공")
    // reject 함수 Promise 내부에서 동작하는 작업이 실패 했을 경우 동작
    reject("실패")
})
result3.then(function (res) {
    // then 성공 후에
    console.log(res);
})

// 위 코드 자체는 비동기 코드 x
// Promise에서 setTimeout를 걸어줘야 비동기 로직이 됨
// 콜백은 다른 함수에 전달하는 함수
// 기존의 callback 구조를 then / catch로 받을 수 있게 하는 것이 Promise임