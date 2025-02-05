// 예외처리

let valid = true

function delay(ms) {
    return new Promise(() => {
        setTimeout(() => {
            if(valid) {
                console.log("특정조건 이행")
                resolve("SUCCESS")
            } else {
                console.log("특정조건 불이행")
                reject("FAIL")
            }
        }, ms)
    })
}

delay(3000).then((res)=>{
    console.log(res);
}).catch((error) => {
    console.log(error);
})