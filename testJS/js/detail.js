const bodyEl = document.querySelector(".container_body")
const posts = JSON.parse(localStorage.getItem("posts"))
const selectedIdindex = JSON.parse(localStorage.getItem("selectedId"))

bodyEl.innerHTML = `
    <div class="container_body_info">아래 입력란을 수정해 주세요.</div>
    <div class="container_body_inputBox">
        <span class="label">제목</span>
        <input type="text" placeholder="제목을 입력하세요." value="${posts[selectedIdindex].title}" class="input title">
    </div>
    <div class="container_body_inputBox">
        <span class="label">작성자</span>
        <input type="text" placeholder="작성자을 입력하세요." value="${posts[selectedIdindex].user}" class="input user">
    </div>
    <div class="container_body_inputBox">
        <span class="label">내용</span>
        <input type="text" placeholder="내용을 입력하세요." value="${posts[selectedIdindex].content}" class="input content">
    </div>
    <div class="container_body_inputBox">
        <span class="label">작성날짜</span>
        <input type="text" placeholder="작성날짜를 입력하세요." value="${posts[selectedIdindex].createAt}" class="input createAt">
    </div>
`

const titleTag = document.querySelector(".input.title")
const userTag = document.querySelector(".input.user")
const contentTag = document.querySelector(".input.content")
const createAtTag = document.querySelector(".input.createAt")

//-------------------------------------------------------------------

// 수정
const updateBtn = document.querySelector(".container_footer_button.update")

let title = ""
let user = ""
let content = ""
let createAt = ""
// addEventListener 액션을 해줌
// ("input") 버튼 누를 시 값을 받음
titleTag.addEventListener('input', (event) => {
    title = event.target.value
})
userTag.addEventListener('input', (event) => {
    user = event.target.value
})
contentTag.addEventListener('input', (event) => {
    content = event.target.value
})
createAtTag.addEventListener('input', (event) => {
    createAt = event.target.value
})

updateBtn.addEventListener("click", () => {
    posts[selectedIdindex].title = title
    posts[selectedIdindex].user = user
    posts[selectedIdindex].content = content
    posts[selectedIdindex].createAt = createAt

    console.log(posts);

    const original = [...JSON.parse(localStorage.getItem("posts"))]

    original.forEach((item) => {
        if (item.id === posts[selectedIdindex].id) {
            item.title = posts[selectedIdindex].title
            item.user = posts[selectedIdindex].title
            item.content = posts[selectedIdindex].content
            item.createAt = posts[selectedIdindex].createAt
        } 
    })
    localStorage.setItem("posts", JSON.stringify(original))
    window.alert("수정이 완료되었습니다.")
    location.href = "index.html"
})