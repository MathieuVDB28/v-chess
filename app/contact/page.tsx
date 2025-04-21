import Navbar from '@/app/components/Navbar'
import Footer from '@/app/components/Footer'

export default function ContactPage() {
    return (
        <>
            <Navbar />
            <section className="py-10">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div>
                        <h2 className="text-primary text-4xl font-medium leading-6 mb-4 lg:text-left text-center">Contact
                            Us</h2>
                        <p className="text-white font-manrope text-base font-semibold leading-10 lg:text-left text-center">
                            If you have any recommendations for improving our platform, please don't hesitate to contact us. <br/>
                            We look forward to hearing from you. <br/>
                            If you have any questions please feel free to contact us too. We will get back to you.
                        </p>
                    </div>
                    <div className="grid grid-cols-1 gap-x-24 mt-8">
                        <div className="flex items-center lg:mb-0 mb-10">
                            <div className="flex flex-row w-full">
                                <form action="" className="w-full">
                                    <input type="text"
                                           name="subject"
                                           className="w-full h-14 shadow-sm text-gray-600 placeholder-text-400 text-lg font-normal leading-7 rounded-full border border-gray-200 focus:outline-none py-2 px-4 mb-8"
                                           placeholder="Reason for contacting us"/>
                                    <div className="flex flex-col md:flex-row md:gap-4 w-full mb-8">
                                        <input type="text"
                                               name="name"
                                               className="w-full md:w-1/2 h-14 shadow-sm text-gray-600 placeholder-text-400 text-lg font-normal leading-7 rounded-full border border-gray-200 focus:outline-none py-2 px-4 mb-8 md:mb-0"
                                               placeholder="Name"/>
                                        <input type="email"
                                               name="email"
                                               className="w-full md:w-1/2 h-14 shadow-sm text-gray-600 placeholder-text-400 text-lg font-normal leading-7 rounded-full border border-gray-200 focus:outline-none py-2 px-4"
                                               placeholder="Email"/>
                                    </div>
                                    <textarea id="text"
                                              name="message"
                                              className="w-full h-48 shadow-sm resize-none text-gray-600 placeholder-text-400 text-lg font-normal leading-7 rounded-2xl border border-gray-200 focus:outline-none px-4 py-4 mb-8"
                                              placeholder="Message">
                                    </textarea>
                                    <button
                                        className="w-full h-12 text-center text-white text-base font-semibold leading-6 rounded-full bg-primary shadow transition-all duration-700 hover:bg-indigo-800">
                                        Submit
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
            <Footer />
        </>
    )
}