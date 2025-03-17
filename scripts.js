const posts = [
  {
    "date": "2025-03-17",
    "title": "skullbreaker",
    "file": "posts/2025-03-17-skullbreaker.html"
  },
  {
    "date": "2025-03-15",
    "title": "I can post",
    "file": "posts/2025-03-15-I-can-post.html"
  },
  {
    "date": "2025-03-15",
    "title": "devotionail",
    "file": "posts/2025-03-15-devotionail.html"
  },
  {
    "date": "2025-03-14",
    "title": "a start",
    "file": "posts/2025-03-14-a-start.html"
  },
  {
    "date": "2025-03-10",
    "title": "helloworld",
    "file": "posts/2025-03-10-helloworld.html"
  }
];
const blogDiv = document.getElementById("blog-posts");
blogDiv.innerHTML = posts.map(post => `<a href="${post.file}">${post.date} ~ ${post.title}</a>`).join("\n");