const createBtn = document.querySelector(".container_footer_button")
const bodyEl = document.querySelector(".container_body")

createBtn.addEventListener("click", () => {
    // 생성하기 버튼 클릭 시 생성 페이지로 이동
    location.href = "create.html"
})

//-----------------------------------------------------------------------------------

// 로컬스토리지에 있는 데이터를 기준으로 리스트 UI 추가
const posts = JSON.parse(localStorage.getItem("posts"))
const postIds = []

if (posts === null) {
    bodyEl.innerHTML = `<div class="container_body_noData">
    <span>등록된 게시물이 없습니다.</span>`
} else {
    posts.forEach((post) => {
        // 같은 것이 반복되서 추가할때 += 가능
        bodyEl.innerHTML += `
            <div class="container_body_list">
                <span class="id">게시물 번호: NO.${post.id}</span>
                <span class="title">제목: ${post.title}</span>
                <span class="content">내용: ${post.content}</span>
                <span class="createAt">${post.createAt}</span>
                <button class="btn_update">상세보기</button>
            </div>`
        postIds.push(post.id)
    })
}
// 배열 로컬 스트레지에 담음
localStorage.setItem("ids", JSON.stringify(postIds))

//-----------------------------------------------------------------------------------

// 각 게시물 클릭
// 해당된 모든 값을 불러옴
const buttons = document.querySelectorAll(".btn_update")
buttons.forEach((button, index) => {
    button.addEventListener("click", () => {
        localStorage.setItem("selectedId", JSON.stringify(index))

        // 상세보기 페이지로 이동
        location.href = "detail.html"
    })
})