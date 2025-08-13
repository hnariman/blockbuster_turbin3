export default function Report() {
    const onSubmit = (form:FormData) => {
        console.log({form});
    }

    return (
        <section>
            <form onSubmit={(e)=>onSubmit(e)} > 
                <input type="text" placeholder="solana address" />
            </form>
        </section>
    )
}