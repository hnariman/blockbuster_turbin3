import Image from "next/image"
export function DashboardFeature() {
  const onSubmit = (data: FormData) => {
    alert(data)
  }


  return (
    <section className="w-full grid justify-items-center">
      <h1 className="text-8xl text-yellow-500 font-extrabold m-12" >
        Block Buster
      </h1>
      <Image
      className="rounded-4xl"
        src="/img2.png"
        alt={""}
        width={600}
        height={600}
      /> 

      <form className="w-2/3 grid gap-3 justify-items-center">
        <input
          className="border-neutral-300 bg-fuchsia-50 text-black p-4 w-full rounded-2xl"
          type="text"
          name="suspect"
          id="suspect"
          placeholder="pubkey"
        />
        <button
          type="submit"
          className="text-2xl font-extrabold p-2 border rounded-2xl bg-yellow-500 text-gray-900 w-full ">
          Bust'em
        </button>


      </form>
    </section>
  )
}
