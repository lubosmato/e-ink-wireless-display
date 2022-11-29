<script lang="ts">
  import Header from "$lib/header/Header.svelte"
  import { UploadWallpaper } from "../generated/graphql"

  let preview: HTMLImageElement
  let inputImage: HTMLInputElement
  let showImage = false
  let hasError = false
  let isDone = false

  const onImageChange = () => {
    const file = inputImage?.files?.item(0)

    if (!file) {
      showImage = false
      return
    }

    const reader = new FileReader()
    reader.addEventListener("load", () => {
      if (!reader.result) return
      preview.setAttribute("src", reader.result.toString())
      showImage = true
    })
    reader.readAsDataURL(file)
  }

  const uploadWallpaper = async () => {
    const file = inputImage?.files?.item(0)

    if (!file) return

    const success = await UploadWallpaper({
      variables: {
        image: file,
      },
    })
    hasError = !success.data?.uploadWallpaper
    if (!hasError) isDone = true
  }
</script>

<svelte:head>
  <title>E-Ink display view</title>
</svelte:head>

<slot name="head">
  <Header />
</slot>

<section>
  {#if !isDone}
    {#if hasError}
      Něco se pokazilo, zkuste to znovu.
    {/if}
    <input bind:this={inputImage} type="file" on:change={onImageChange} />
    <button on:click={uploadWallpaper}>Set wallpaper</button>
    <img bind:this={preview} alt="Preview" class={!showImage ? "hidden" : ""} />
  {:else}
    Pozadí úspěšně nahráno!
  {/if}
</section>

<style lang="sass">
.hidden
  display: none
</style>
