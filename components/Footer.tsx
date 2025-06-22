export const Footer = () => {
  return (
    <footer className="bg-gray-100 pt-10 pb-3 flex flex-col items-center space-y-1 ">
      <p className="font-semibold italic text-lg text-gray-700 text-center">
        Crafted & Developed by {""}
        <a
          href="https://www.linkedin.com/in/yuusuf-abdullahi-temidayo-yusasive"
          className="text-blue-500 hover:text-blue-700 transition"
        >
          Yusasive
        </a>
      </p>
      <p className="text-sm text-gray-500">
        © {new Date().getFullYear()} All rights reserved.
      </p>
    </footer>
  );
};
