document.addEventListener("DOMContentLoaded", () => {
  const storage = caches.open("save.images.localhost.google.com");

  fetch("https://picsum.photos/v2/list")
    .then((res) => {
      if (!res.ok) {
        throw new Error(res.statusText);
      }

      return res.json();
    })
    .then((data) => {
      if (!Array.isArray(data))
        throw new Error("Recieved data is not an array");

      drawImages(data.map((img) => img.download_url));
      data.forEach((img) => getImage(img.download_url));
    })
    .catch((err) => console.log(`An error occured: ${err}`));

  function fetchAndCacheImage(url) {
    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error(res.statusText);

        return res.blob();
      })
      .then((blob) => {
        drawImage(blob, url);

        const resp = new Response(blob, {
          status: 200,
          statusText: "Image saved!",
          headers: new Headers({
            expires: new Date().setDate(new Date().getDate() + 7).toString(),
          }),
        });

        storage.then((cache) => {
          cache.put(url, resp);
        });

        console.log(`${url} loaded from NETWORK!`);
      })
      .catch((err) => console.log(`An error occured: ${err}`));
  }

  function getImage(url) {
    storage.then((cache) => {
      cache
        .match(url)
        .then(async (data) => {
          if (!data) return fetchAndCacheImage(url);

          const exp = data.headers.get("expires") ?? 0;

          if (new Date() > exp) {
            cache.delete(url);
            return fetchAndCacheImage(url);
          }

          console.log(`${url} loaded from CACHE!`);
          return data.blob();
        })
        .then((blob) => {
          if (blob instanceof Blob) drawImage(blob, url);
        });
    });
  }

  function drawImages(images) {
    const df = new DocumentFragment();

    images.forEach((item) => {
      const el = document.createElement("div");
      el.setAttribute("data-url", item);
      df.append(el);
    });

    document.getElementById("parent").append(df);
  }

  function drawImage(blob, url) {
    const parent = document.querySelector(`[data-url='${url}']`);

    const el = document.createElement("img");
    el.src = URL.createObjectURL(blob);

    parent.append(el);
  }
});
