function changeLinkHref () {
  // https://link.jianshu.com?t=xxxxxx 简书
  // https://links.jianshu.com/go?to=xxxxxx 简书2
  // https://link.juejin.cn/?target=xxxxx 掘金
  // https://link.zhihu.com/?target=xxxxx 知乎
  const links = document.querySelectorAll('a')
  const reg = /(?:cn\/\?target|com?\/\?t|com\/\?target|com\/go\?to)=(.*)/
  let count = 0;
  links.forEach(link => {
    const match = reg.exec(link.href)
    if(match && match[1]) {
      link.href = decodeURIComponent(match[1])
      count++
    }
  })
  // csdn是通过添加事件来改写link跳转逻辑的，因此需要移除事件才行
  //   const csdnHack = document.querySelector('#content_views')
  //   if(csdnHack) {
  //     csdnHack.replaceWith(csdnHack.cloneNode(true));
  //     count += csdnHack.querySelectorAll('a').length
  //   }
  console.log(`本页面共 ${count} 个外链现在可以直接跳转了 --forceJump插件`)
  if(location.href.includes('https://www.zhihu.com/question/')) {
    const titles = document.querySelectorAll('.QuestionHeader-title')
    if(titles) {
      titles.forEach(title => {
        title.innerHTML = ''
      })
    }
  }
}
changeLinkHref()
setTimeout(changeLinkHref, 1000)

