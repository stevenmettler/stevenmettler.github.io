const posts = [
  {
    "date": "2025-03-10",
    "title": "helloworld",
    "file": "posts/2025-03-10-helloworld.html"
  }
];
const blogDiv = document.getElementById("blog-posts");
blogDiv.innerHTML = posts.map(post => `<a href="${post.file}">${post.date} ~ ${post.title}</a>`).join("\n");