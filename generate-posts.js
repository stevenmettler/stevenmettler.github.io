const fs = require("fs");
const path = require("path");

const postsDir = "./posts";
const posts = fs.readdirSync(postsDir)
    .filter(file => file.endsWith(".html"))
    .map(file => {
        const [year, month, day, ...titleParts] = file.replace(".html", "").split("-");
        const date = `${year}-${month}-${day}`;
        const title = titleParts.join(" ");
        return { date, title, file: `posts/${file}` };
    })
    .sort((a, b) => b.date.localeCompare(a.date));

const jsContent = `const posts = ${JSON.stringify(posts, null, 2)};\n` +
    `const blogDiv = document.getElementById("blog-posts");\n` +
    `blogDiv.innerHTML = posts.map(post => \`<a href="\${post.file}" class="blog-row"><span class="blog-row-title">\${post.title}</span><span class="blog-row-date">\${post.date.replace(/-/g, "\\u00b7")}</span></a>\`).join("\\n");`;

fs.writeFileSync("scripts.js", jsContent);
console.log("Generated scripts.js with", posts.length, "posts");