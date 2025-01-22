// 각 input 태그
const titleTag = document.querySelector(".input.title")
const userTag = document.querySelector(".input.user")
const contentTag = document.querySelector(".input.content")
const createAtTag = document.querySelector(".input.createAt")

// 버튼 태그
const buttonTag = document.querySelector(".container_footer_button")

//-----------------------------------------------------

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

//-----------------------------------------------------------------------------------

let posts = []

buttonTag.addEventListener('click', () => {
    let post = {
        title,
        user,
        content,
        createAt
    }
    // posts라는 이름으로 로컬 스트레지에 있는 getitem를 통하여 조회한다.
    const addedPosts = JSON.parse(localStorage.getItem('posts'))

    if (addedPosts !== null) {
        // 로컬스토리지 조회 후 이미 posts 배열 데이터가 있다면
        posts = [...addedPosts]

        if (title === "" || user === "" || content === "" || createAt === "") {
            window.alert("빈칸을 채워주세요.")
        } else if (title !== "" && user !== "" && content !== "" && createAt !== "") {
            posts.push(post)
            posts.forEach((post, index) => {
                post.id = index + 1
            })
            // 로컬 스토리지에 저장
            localStorage.setItem("posts", JSON.stringify(posts))
            window.alert("등록이 완료되었습니다.")
            location.href = "index.html"
        }
    } else {
        // 로컬스토리지 조회 후 이미 posts 배열 데이터가 없으면
        // 아래 데이터를 객체로 만들어서 로컬스토리지에 담기
        if (title === "" || user === "" || content === "" || createAt === "") {
            window.alert("빈칸을 채워주세요.")
        } else if (title !== "" && user !== "" && content !== "" && createAt !== "") {
            posts.push(post)
            posts.forEach((post, index) => {
                post.id = index + 1
            })
            // 로컬 스토리지에 저장
            localStorage.setItem("posts", JSON.stringify(posts))
            window.alert("등록이 완료되었습니다.")
            location.href = "index.html"
        }
    }
})