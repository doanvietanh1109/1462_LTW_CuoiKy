export const blogCategories = [
  { slug: "tim-phong", label: "Kinh nghiệm tìm phòng" },
  { slug: "hop-dong-dat-coc", label: "Hợp đồng và đặt cọc" },
  { slug: "chi-phi", label: "Chi phí thuê trọ" },
  { slug: "an-toan", label: "An toàn và phòng tránh lừa đảo" },
  { slug: "cuoc-song", label: "Kinh nghiệm sống ở trọ" },
  { slug: "chuyen-tro", label: "Chuyển trọ và thủ tục cư trú" },
];

const categoryLabel = Object.fromEntries(blogCategories.map(({ slug, label }) => [slug, label]));

export const blogPosts = [
  {
    slug: "12-dieu-can-kiem-tra-truoc-khi-thue-phong-tro",
    aliases: ["kiem-tra-gi-truoc-khi-thue-phong-tro"],
    title: "12 điều cần kiểm tra trước khi thuê phòng trọ",
    categorySlug: "tim-phong", featured: true, showRoomCta: true,
    image: "/images/blog/RIPT_Rental_12_Dieu_Kiem_Tra_Blue.png", imageAlt: "Ảnh bìa Blue: 12 điều cần kiểm tra trước khi thuê phòng trọ, với checklist về hiện trạng, chi phí, điện nước và an ninh",
    excerpt: "Một buổi xem phòng có chuẩn bị giúp bạn nhìn rõ hiện trạng, chi phí và cách sinh hoạt trước khi đặt cọc.",
    keywords: ["xem phòng", "checklist", "kiểm tra nhà trọ", "thuê phòng"],
    introduction: "Đừng chỉ quyết định dựa trên ảnh đăng hoặc vài phút đầu tiên trong phòng. Hãy dành thời gian kiểm tra theo cùng một thứ tự để dễ so sánh các lựa chọn và ghi lại điều cần hỏi. Mười hai điểm dưới đây tập trung vào những việc người thuê có thể tự quan sát, thử hoặc xác nhận trực tiếp.",
    sections: [
      { heading: "Quan sát căn phòng từ cửa vào đến góc khuất", paragraphs: ["Kiểm tra khóa cửa, chốt cửa sổ, ánh sáng ban ngày, độ thông gió và tiếng ồn. Nhìn kỹ trần, chân tường, góc sau tủ và khu vực nhà vệ sinh để nhận ra vết thấm, mốc hoặc mùi lạ. Nếu có thể, hỏi xem tình trạng đó xuất hiện theo mùa hay sau mưa.", "Thử vòi nước, thoát sàn, công tắc, ổ cắm và thiết bị được nói là có sẵn. Mở tủ, cửa nhà vệ sinh và cửa sổ thay vì chỉ nhìn mặt ngoài. Ghi lại đồ nội thất nào sẽ được bàn giao, món nào không thuộc phòng và các hư hỏng có trước ngày nhận."] , bullets: ["Cửa chính, khóa, cửa sổ và chốt an toàn", "Áp lực nước, thoát nước, ổ cắm, đèn và quạt", "Vết ẩm, mùi, tiếng ồn và ánh sáng tự nhiên"] },
      { heading: "Tìm hiểu khu trọ và đường đi hằng ngày", paragraphs: ["Thử ước lượng quãng đường đến trường, nơi làm hoặc điểm xe buýt vào khung giờ bạn thường đi. Hỏi cách gửi xe, nhận hàng, đổ rác, sử dụng khu vực chung và xử lý khi mất điện nước. Các chi tiết nhỏ này ảnh hưởng nhiều đến sinh hoạt sau khi chuyển vào.", "Nếu lịch của bạn khác giờ hành chính, hỏi rõ cách ra vào và việc khách đến chơi. Quan sát lối đi chung có bị chắn, thiếu sáng hoặc khó thoát ra không. Một lần xem phòng vào ban ngày không thể cho biết hết tiếng ồn buổi tối, nên hãy cân nhắc hỏi người đang ở gần đó hoặc quay lại vào thời điểm khác."] },
      { heading: "Chốt rõ tiền thuê và điều kiện trước khi giữ phòng", paragraphs: ["Liệt kê tiền thuê và từng khoản ngoài tiền phòng: điện, nước, mạng, gửi xe, vệ sinh hay phí chung. Hỏi đơn vị tính, thời điểm chốt và cách xem số liệu. Không mặc định một khoản đã bao gồm nếu nội dung đăng tin hoặc thỏa thuận chưa nói rõ.", "Trước khi chuyển cọc, xác nhận người nhận tiền có quyền cho thuê, số tiền, mục đích giữ chỗ, điều kiện hoàn hoặc khấu trừ và thời hạn phản hồi. Biên nhận cần ghi ngày, số tiền, phòng nào và thỏa thuận đi kèm. Đọc lại hợp đồng hoặc xác nhận bằng văn bản nếu lời trao đổi khác với nội dung giấy tờ."] },
    ],
    checklist: ["Chụp ảnh hiện trạng và thiết bị bàn giao.", "Ghi lại mọi khoản thu cùng đơn vị tính.", "Lưu thông tin người cho thuê và biên nhận cọc."],
    conclusion: "Một căn phòng phù hợp cần đáp ứng cả nhu cầu ở, ngân sách và điều kiện thuê rõ ràng. Dùng danh sách này cho mỗi lần xem phòng sẽ giúp bạn quyết định bình tĩnh và có cơ sở hơn.",
    relatedSlugs: ["checklist-di-xem-phong-truc-tiep", "chon-phong-tro-theo-ngan-sach-va-vi-tri", "dau-hieu-tin-dang-phong-tro-lua-dao"],
  },
  {
    slug: "kinh-nghiem-tim-phong-tro-cho-sinh-vien-nam-nhat",
    showRoomCta: true,
    title: "Kinh nghiệm tìm phòng trọ cho sinh viên năm nhất",
    categorySlug: "tim-phong", image: "/images/blog/RIPT_Rental_01.png", imageAlt: "Ảnh bìa Blue: Kinh nghiệm tìm phòng trọ cho sinh viên năm nhất",
    excerpt: "Lập ngân sách, chọn khu vực theo lịch học và đi xem phòng cùng người tin cậy giúp lần đầu thuê trọ bớt bối rối.",
    keywords: ["sinh viên", "năm nhất", "ký túc xá", "ngân sách", "tìm phòng"],
    introduction: "Lần đầu tự tìm chỗ ở thường có nhiều việc phải quyết định cùng lúc: ở gần trường hay xa hơn, thuê một mình hay ở ghép, cần chuẩn bị khoản tiền ban đầu bao nhiêu. Thay vì tìm căn rẻ nhất ngay lập tức, hãy xác định nhu cầu tối thiểu và kiểm tra từng lựa chọn bằng thông tin cụ thể.",
    sections: [
      { heading: "Lập ngân sách theo cả tháng lẫn khoản ban đầu", paragraphs: ["Tính tổng chi phí sinh hoạt có thể dành cho chỗ ở, không chỉ tiền thuê. Cộng dự kiến điện nước, mạng, gửi xe, đi lại và các khoản chung. Khoản cần chuẩn bị lúc chuyển vào có thể gồm tiền thuê kỳ đầu, tiền cọc, vận chuyển và vật dụng thiết yếu; hãy hỏi rõ khoản nào được hoàn lại và khi nào.", "Nếu gia đình hỗ trợ một phần, thống nhất trước mức ngân sách và cách thanh toán. Để lại một khoản dự phòng cho chi phí phát sinh thay vì dùng hết tiền có sẵn để đặt cọc. Các con số nên dựa trên hoàn cảnh của bạn; đừng lấy mức giá truyền miệng làm cam kết rằng một khu vực luôn có giá như vậy."] },
      { heading: "Chọn khu vực dựa trên lịch học thật", paragraphs: ["Mở bản đồ để so sánh thời gian di chuyển đến trường, nơi thực tập, tuyến xe buýt và chỗ mua đồ cần thiết. Một phòng xa hơn đôi chút nhưng đi lại thuận tiện có thể phù hợp hơn lựa chọn rẻ nhưng khiến bạn tốn nhiều thời gian mỗi ngày.", "Tìm hiểu tuyến đường vào buổi tối, điểm đón xe và điều kiện gửi xe. Hỏi bạn học hoặc anh chị khóa trên về các khu thường được sinh viên cân nhắc, nhưng tự xác minh địa chỉ, tình trạng phòng và chi phí. Không gửi giấy tờ cá nhân hoặc tiền chỉ vì một người lạ nhận là “cộng tác viên của trường”."] },
      { heading: "Đi xem cùng người tin cậy và lưu hồ sơ", paragraphs: ["Nếu chưa quen thuê trọ, hãy rủ người thân hoặc bạn bè đi xem. Hai người có thể chú ý những chi tiết khác nhau và cùng nghe thỏa thuận. Chuẩn bị câu hỏi trên điện thoại, ghi lại câu trả lời và xin phép trước khi chụp ảnh khu vực riêng tư.", "Trước khi ký hoặc cọc, đọc kỹ tên người cho thuê, địa chỉ phòng, tổng tiền, điều kiện kết thúc thuê và cách nhận lại tiền cọc. Nếu một nội dung chưa hiểu, xin thời gian hỏi người thân hoặc cơ quan hỗ trợ sinh viên. Không cần quyết định ngay chỉ vì người đăng nói có nhiều người đang chờ."] },
    ],
    checklist: ["Thống nhất ngân sách với gia đình.", "Kiểm tra đường đi theo lịch học.", "Lưu địa chỉ, ảnh hiện trạng và thông tin liên hệ."],
    conclusion: "Tìm phòng lần đầu sẽ nhẹ nhàng hơn khi bạn chia việc thành ba bước: tính khả năng chi trả, chọn khu vực và kiểm tra thỏa thuận. Hãy cho mình đủ thời gian để so sánh, không cần đặt cọc khi còn nghi ngờ.",
    relatedSlugs: ["chon-phong-tro-theo-ngan-sach-va-vi-tri", "checklist-di-xem-phong-truc-tiep", "12-dieu-can-kiem-tra-truoc-khi-thue-phong-tro"],
  },
  {
    slug: "chon-phong-tro-theo-ngan-sach-va-vi-tri",
    showRoomCta: true,
    title: "Cách chọn phòng trọ phù hợp ngân sách và vị trí",
    categorySlug: "tim-phong", image: "/images/blog/RIPT_Rental_02.png", imageAlt: "Ảnh bìa Blue: Cách chọn phòng trọ phù hợp ngân sách và vị trí",
    excerpt: "So sánh tổng chi phí và thời gian đi lại để chọn nơi ở phù hợp với nhịp sống, thay vì chỉ nhìn giá thuê.",
    keywords: ["ngân sách", "vị trí", "chi phí thuê", "đi lại"],
    introduction: "Phòng có giá thuê thấp chưa chắc là lựa chọn tiết kiệm nhất nếu xa nơi học, nơi làm hoặc có nhiều chi phí phụ. Một cách so sánh hữu ích là đặt các căn phòng vào cùng một bảng tiêu chí, sau đó cân nhắc điều gì quan trọng nhất với lịch sinh hoạt của bạn.",
    sections: [
      { heading: "Tính tổng chi phí có thể dự đoán", paragraphs: ["Với mỗi phòng, ghi riêng tiền thuê, điện, nước, internet, gửi xe và các khoản chung. Ghi thêm số người được tính, đơn giá hoặc cách chia. Nếu chưa biết mức sử dụng thực tế, tạo một khoảng ước lượng cá nhân và đánh dấu đó là dự kiến, không xem như số tiền chắc chắn.", "So sánh cả khoản trả lúc đầu như cọc, kỳ thuê đầu và vận chuyển. Ví dụ minh họa: hai phòng có tiền thuê chênh nhau nhưng phòng rẻ hơn lại cách xa điểm đến, khiến chi phí đi lại tăng. Chỉ cộng các khoản bạn đã xác nhận hoặc ghi rõ giả định để tránh tạo cảm giác chính xác giả."] },
      { heading: "Đánh giá vị trí bằng thời gian và tiện ích", paragraphs: ["Đo thời gian đi lại vào đúng khung giờ bạn thường ra ngoài. Kiểm tra tuyến đường, khả năng gửi xe, chợ hoặc cửa hàng cần thiết và mức độ thuận tiện khi trời mưa. Nếu lịch của bạn thay đổi theo ca, xem liệu đường về buổi tối có phù hợp không.", "Đừng chỉ dựa vào khoảng cách đường chim bay. Ngõ nhỏ, điểm quay đầu hoặc tuyến xe ít chuyến có thể làm thời gian thực tế khác nhiều. Nếu có thể, đi thử hành trình một lần. Ghi lại lợi ích cụ thể của vị trí như gần trường, gần phương tiện công cộng hoặc tiết kiệm thời gian chăm sóc gia đình."] },
      { heading: "Chấm điểm theo ưu tiên cá nhân", paragraphs: ["Chọn ba tiêu chí không thể thiếu và ba tiêu chí có thể linh hoạt. Ví dụ, bạn có thể ưu tiên an toàn, thời gian đi lại và nơi để xe; diện tích hoặc nội thất có thể chấp nhận ở mức vừa đủ. Đặt trọng số giúp tránh bị hấp dẫn bởi một ưu điểm nổi bật nhưng bỏ qua điều bất tiện hằng ngày.", "Sau khi lọc, chỉ đi xem những phòng đạt tiêu chí tối thiểu. Ghi cảm nhận ngay sau mỗi lần xem và kiểm tra lại khoản nào chưa rõ. Nếu hai lựa chọn gần ngang nhau, trao đổi với người sẽ cùng ở hoặc người cùng chia sẻ ngân sách trước khi quyết định."] },
    ],
    checklist: ["Tạo bảng tổng tiền hằng tháng và khoản đầu vào.", "Đi thử tuyến đường vào giờ thường đi.", "Phân biệt thông tin đã xác nhận với ước tính."],
    conclusion: "Lựa chọn tốt là phương án cân bằng được khả năng chi trả, thời gian và nhu cầu sử dụng thật. Ghi giả định rõ ràng giúp phép so sánh hữu ích mà không biến giá dự kiến thành lời hứa.",
    relatedSlugs: ["12-dieu-can-kiem-tra-truoc-khi-thue-phong-tro", "kinh-nghiem-tim-phong-tro-cho-sinh-vien-nam-nhat", "nhung-khoan-phi-can-hoi-ro-khi-thue-tro"],
  },
  {
    slug: "checklist-di-xem-phong-truc-tiep",
    showRoomCta: true,
    title: "Checklist khi đi xem phòng trọ trực tiếp",
    categorySlug: "tim-phong", image: "/images/blog/RIPT_Rental_03.png", imageAlt: "Ảnh bìa Blue: Checklist khi đi xem phòng trọ trực tiếp",
    excerpt: "Chuẩn bị câu hỏi và ghi nhận tình trạng ngay tại chỗ để buổi xem phòng có kết quả rõ ràng.",
    keywords: ["checklist", "xem phòng trực tiếp", "ghi nhận", "bàn giao"],
    introduction: "Đi xem phòng thường diễn ra nhanh, nhất là khi bạn phải ghé nhiều địa chỉ trong ngày. Một checklist ngắn giúp bạn quan sát có trình tự, hỏi đúng người và giữ lại thông tin để so sánh sau đó. Bạn có thể lưu các mục dưới đây vào điện thoại trước khi đi.",
    sections: [
      { heading: "Trước buổi hẹn", paragraphs: ["Xác nhận địa chỉ, mã phòng, người sẽ gặp và giờ hẹn. Hỏi trước phòng còn trống không, giá trong tin đăng áp dụng cho phòng nào, có khoản giữ chỗ hay không. Gửi địa chỉ cho người thân nếu bạn đi một mình và chọn thời gian, phương tiện di chuyển phù hợp.", "Chuẩn bị điện thoại đủ pin, ghi chú câu hỏi và thước dây nếu bạn cần đo đồ nội thất. Đừng chuyển tiền trước để “giữ lịch xem” khi chưa xác minh người nhận và điều kiện. Nếu địa chỉ thay đổi đột ngột hoặc người hẹn yêu cầu gặp ở nơi khác không rõ lý do, hãy cân nhắc lại cuộc hẹn."] },
      { heading: "Trong lúc xem", paragraphs: ["Kiểm tra cửa, cửa sổ, ổ khóa, nước, thoát sàn, ổ cắm và thiết bị. Quan sát dấu hiệu thấm, mốc, côn trùng và tiếng ồn. Hỏi quy định giờ giấc, chỗ để xe, khách đến chơi, khu vực chung và cách liên hệ khi có hỏng hóc.", "Xin phép trước khi chụp ảnh hoặc quay video. Ghi lại hiện trạng và đồ đạc được bàn giao; đừng chụp giấy tờ hoặc khu vực riêng của người khác. Ghi con số đồng hồ điện nước nếu có thể đọc được và hỏi cách xác nhận chỉ số lúc nhận phòng."] },
      { heading: "Trước khi rời đi", paragraphs: ["Đọc lại các khoản phí, tiền cọc, ngày vào ở và lịch thanh toán. Tóm tắt điều bạn hiểu cho người cho thuê xác nhận để hai bên phát hiện khác biệt. Nếu họ hứa sửa chữa hoặc bổ sung thiết bị, ghi rõ nội dung và thời điểm dự kiến.", "Sau buổi xem, ghi điểm tốt, điểm cần hỏi và mức độ phù hợp vào cùng một mẫu. Chờ đến khi kiểm tra xong giấy tờ và điều khoản rồi mới quyết định. Khi đã đồng ý, lưu bản thỏa thuận, biên nhận và ảnh hiện trạng ở nơi có sao lưu."] },
    ],
    checklist: ["Thông tin hẹn và địa chỉ đã xác nhận.", "Ảnh hiện trạng được chụp với sự đồng ý.", "Phí, cọc, ngày nhận và điều kiện đã ghi lại."],
    conclusion: "Một buổi xem phòng hiệu quả không cần kéo dài, nhưng cần để lại đủ thông tin. Checklist giúp bạn nhớ điều quan trọng và so sánh bằng dữ kiện thay vì cảm giác nhất thời.",
    relatedSlugs: ["12-dieu-can-kiem-tra-truoc-khi-thue-phong-tro", "nhan-biet-tin-dang-phong-tro-lua-dao", "nhung-dieu-can-biet-truoc-khi-dat-coc-thue-tro"],
  },
  {
    slug: "nhung-dieu-can-biet-truoc-khi-dat-coc-thue-tro",
    title: "Những điều cần biết trước khi đặt cọc thuê trọ",
    categorySlug: "hop-dong-dat-coc", image: "/images/blog/RIPT_Rental_04.png", imageAlt: "Ảnh bìa Blue: Những điều cần biết trước khi đặt cọc thuê trọ",
    excerpt: "Xác minh người cho thuê, mục đích khoản cọc và điều kiện hoàn trả trước khi chuyển tiền.",
    keywords: ["đặt cọc", "tiền cọc", "biên nhận", "giữ chỗ"],
    introduction: "Tiền đặt cọc thường được trao đổi trước ngày chuyển vào, vì vậy người thuê cần hiểu chính xác khoản tiền dùng để làm gì và điều gì xảy ra khi kế hoạch thay đổi. Bài viết này là hướng dẫn kiểm tra giao dịch, không thay thế tư vấn pháp lý cho tình huống cụ thể.",
    sections: [
      { heading: "Xác minh phòng và người nhận tiền", paragraphs: ["Đến xem đúng căn phòng, đối chiếu địa chỉ và mã phòng. Hỏi người nhận tiền là chủ nhà, người được ủy quyền hay bên môi giới; nếu họ đại diện cho người khác, yêu cầu xác nhận mối liên hệ và quyền nhận cọc. Tên người nhận trên giao dịch nên khớp với nội dung hai bên ghi nhận.", "Cảnh giác với yêu cầu cọc gấp khi chưa được xem phòng, ảnh không khớp thực tế hoặc địa chỉ mơ hồ. Không gửi ảnh giấy tờ tùy thân đầy đủ cho người chưa xác minh. Nếu cần cung cấp thông tin, hỏi rõ mục đích, kênh lưu trữ và chỉ chia sẻ phần thật sự cần thiết."] },
      { heading: "Ghi rõ mục đích và điều kiện xử lý cọc", paragraphs: ["Văn bản xác nhận nên nêu số tiền, ngày nhận, phòng được giữ, thời gian dự kiến thuê và khoản đó sẽ được tính vào đâu. Hai bên cần thống nhất trường hợp người thuê đổi ý, phòng không được bàn giao như thỏa thuận hoặc thời hạn giữ chỗ kết thúc.", "Tránh câu chung chung như “mất cọc nếu không thuê” khi chưa rõ tình huống áp dụng. Hãy hỏi cụ thể cách xử lý nếu hồ sơ hoặc hiện trạng có vấn đề. Nếu hai bên chưa thống nhất, chưa nên chuyển tiền chỉ để giữ ưu tiên; xin thêm thời gian đọc lại nội dung."] },
      { heading: "Thanh toán có dấu vết và lưu bằng chứng", paragraphs: ["Ưu tiên phương thức có chứng từ. Nội dung chuyển khoản nên nêu mục đích, mã phòng hoặc địa chỉ và tên người thuê theo thỏa thuận. Với tiền mặt, lập biên nhận có chữ ký hoặc xác nhận của các bên, ngày nhận và thông tin giao dịch.", "Lưu tin đăng, tin nhắn, bản thỏa thuận, biên nhận và chứng từ thanh toán. Nếu phát sinh bất đồng, trao đổi bằng văn bản, giữ nguyên nội dung và tìm tư vấn từ cơ quan hoặc chuyên gia phù hợp. Không tự ý công khai thông tin cá nhân của người khác khi đang giải quyết tranh chấp."] },
    ],
    checklist: ["Xem đúng phòng và xác minh người nhận cọc.", "Ghi số tiền, mục đích, thời hạn và điều kiện xử lý.", "Lưu chứng từ thanh toán và toàn bộ xác nhận."],
    conclusion: "Chỉ đặt cọc khi bạn hiểu rõ phòng nào được giữ, ai nhận tiền và thỏa thuận được ghi nhận ra sao. Một biên nhận rõ ràng bảo vệ khả năng đối chiếu của cả hai bên.",
    relatedSlugs: ["doc-hop-dong-thue-phong-tro", "nhung-khoan-phi-can-hoi-ro-khi-thue-tro", "checklist-di-xem-phong-truc-tiep"],
  },
  {
    slug: "doc-hop-dong-thue-phong-tro",
    aliases: ["doc-hop-dong-thue-tro-va-cac-khoan-phi"],
    title: "Hướng dẫn đọc hợp đồng thuê phòng trọ",
    categorySlug: "hop-dong-dat-coc", image: "/images/blog/RIPT_Rental_05.png", imageAlt: "Ảnh bìa Blue: Hướng dẫn đọc hợp đồng thuê phòng trọ",
    excerpt: "Đối chiếu thông tin người thuê, căn phòng, thời hạn, khoản tiền và cách kết thúc thỏa thuận.",
    keywords: ["hợp đồng", "điều khoản thuê", "thời hạn", "chấm dứt thuê"],
    introduction: "Đọc hợp đồng không chỉ là tìm con số tiền thuê. Hãy kiểm tra toàn bộ điều khoản xem có khớp với điều hai bên đã trao đổi hay không, rồi yêu cầu sửa hoặc bổ sung phần còn mơ hồ trước khi ký. Những gợi ý dưới đây giúp bạn đọc có hệ thống, không phải ý kiến pháp lý cho từng trường hợp.",
    sections: [
      { heading: "Đối chiếu người ký và đối tượng thuê", paragraphs: ["Tên các bên, thông tin liên hệ và căn cứ người ký được quyền cho thuê cần rõ ràng. Địa chỉ, số phòng hoặc mô tả vị trí phải đủ để phân biệt với phòng khác. Nếu có người cùng ở hoặc cùng trả tiền, xác định họ có cần được ghi nhận trong thỏa thuận hay không.", "Kiểm tra ngày bắt đầu, ngày bàn giao và thời hạn thuê. Nếu ngày ký khác ngày tính tiền, đề nghị ghi cách xác định kỳ đầu. Danh sách tài sản hoặc nội thất đi kèm nên đủ cụ thể để khi nhận phòng bạn đối chiếu được."] },
      { heading: "Tìm các điều khoản về tiền và sử dụng phòng", paragraphs: ["Đọc giá thuê, kỳ thanh toán, phương thức nhận tiền, tiền cọc và cách ghi nhận khoản đã trả. Mỗi khoản phí khác nên có tên, cách tính hoặc đơn giá, thời điểm thu. Nếu một điều khoản cho phép thay đổi mức thu, cần biết cách thông báo và thời gian áp dụng được hai bên thống nhất.", "Xem quy định về sửa chữa, sử dụng khu chung, khách đến, vật nuôi hoặc cho người khác ở cùng nếu các nội dung này liên quan đến bạn. Câu chữ nên cụ thể và có thể hiểu thống nhất. Hãy đánh dấu điều chưa hiểu để hỏi trước, không ký với suy nghĩ rằng nội dung sẽ tự được giải thích sau."] },
      { heading: "Hiểu điều kiện gia hạn và kết thúc", paragraphs: ["Tìm thời hạn cần thông báo khi muốn kết thúc hoặc gia hạn, cách bàn giao và các khoản cần đối chiếu. Đọc rõ khi nào tiền cọc được hoàn, có thể khấu trừ cho mục nào và chứng từ nào cần cung cấp. Nếu có trường hợp vi phạm hoặc kết thúc sớm, yêu cầu hai bên diễn đạt điều kiện bằng tình huống cụ thể.", "Giữ một bản đầy đủ có xác nhận của các bên và mọi phụ lục. Khi thỏa thuận thay đổi, lưu bản cập nhật và ngày hiệu lực. Với điều khoản có hậu quả tài chính đáng kể hoặc ngôn ngữ khó hiểu, hãy xin tư vấn chuyên môn trước khi đồng ý."] },
    ],
    checklist: ["Tên, thông tin liên hệ và phòng thuê khớp thực tế.", "Giá, phí, cọc và lịch thanh toán đã đọc rõ.", "Điều kiện sửa chữa, gia hạn, kết thúc và bàn giao đã hiểu."],
    conclusion: "Hợp đồng hữu ích nhất khi ghi đúng điều hai bên thực sự thống nhất và có thể đối chiếu sau này. Hãy hỏi, chỉnh sửa và lưu bản hoàn chỉnh trước khi ký.",
    relatedSlugs: ["nhung-dieu-can-biet-truoc-khi-dat-coc-thue-tro", "nhung-khoan-phi-can-hoi-ro-khi-thue-tro", "12-dieu-can-kiem-tra-truoc-khi-thue-phong-tro"],
  },
  {
    slug: "nhung-khoan-phi-can-hoi-ro-khi-thue-tro",
    title: "Những khoản phí phát sinh khi thuê trọ cần hỏi rõ",
    categorySlug: "chi-phi", image: "/images/blog/RIPT_Rental_06.png", imageAlt: "Ảnh bìa Blue: Những khoản phí phát sinh khi thuê trọ cần hỏi rõ",
    excerpt: "Tách từng khoản, đơn vị tính và thời điểm thu để hiểu tổng tiền phải chuẩn bị.",
    keywords: ["phí thuê trọ", "tiền điện", "tiền nước", "gửi xe", "internet"],
    introduction: "Giá thuê thường chỉ là một phần của ngân sách nơi ở. Trước khi đồng ý, hãy hỏi các khoản có thể thu theo tháng, theo người hoặc theo mức sử dụng và cách chủ trọ thông báo số tiền. Mục tiêu là làm rõ cơ sở tính, không suy đoán mức phí áp dụng cho mọi nơi.",
    sections: [
      { heading: "Phí tính theo mức sử dụng", paragraphs: ["Điện, nước hoặc nhiên liệu có thể được tính theo chỉ số, mức khoán hay thỏa thuận khác. Hỏi chỉ số đầu kỳ, cách chốt, đơn giá và cách xem ghi nhận. Nếu có đồng hồ dùng chung, tìm hiểu cách phân bổ và ai có thể giải thích phép tính.", "Khi nhận phòng, ghi số đầu kỳ và lưu ảnh nếu được phép. Cuối kỳ, so sánh số đầu, số cuối, đơn giá và thành tiền. Nếu con số khác thường, hỏi cách tính trước khi thanh toán để có thể đối chiếu cùng dữ liệu thay vì chỉ tranh luận về tổng tiền."] },
      { heading: "Phí dịch vụ và khoản thu chung", paragraphs: ["Hỏi internet, vệ sinh, rác, thang máy, bảo vệ, gửi xe hoặc dịch vụ khác có áp dụng không. Mỗi khoản nên ghi rõ tính theo phòng, người, phương tiện hay mức cố định, khi nào thu và có thay đổi theo điều kiện nào. Không mặc định phí chung được chia đều nếu chưa hỏi cách chia.", "Một ví dụ minh họa: nếu phí mạng được chia cho nhiều phòng, cần biết số người hoặc phòng tham gia và cách xử lý khi có phòng trống. Đây chỉ là ví dụ về câu hỏi nên đặt ra, không phải mức phí hay cách chia bắt buộc. Ghi lại câu trả lời để so với thỏa thuận sau đó."] },
      { heading: "Khoản tiền ban đầu và chi phí chuyển vào", paragraphs: ["Ngoài cọc và kỳ thuê đầu, có thể phát sinh phí vận chuyển, lắp đặt mạng, mua vật dụng hoặc gửi xe theo kỳ. Hỏi khoản nào thu một lần, khoản nào định kỳ và khoản nào hoàn lại. Ghi rõ biên nhận với tiền trao trước khi nhận phòng.", "Dùng một bảng đơn giản gồm tên khoản, số tiền, đơn vị tính, ngày đến hạn và bằng chứng. Nếu chưa biết mức, đánh dấu “cần xác nhận” thay vì điền con số ước lượng như khoản phải trả. Cách này giúp ngân sách thực tế hơn và làm rõ điểm cần trao đổi với người cho thuê."] },
    ],
    checklist: ["Hỏi đơn vị tính của từng khoản.", "Phân biệt phí cố định, phí theo sử dụng và phí một lần.", "Lưu ảnh chỉ số, hóa đơn và biên nhận."],
    conclusion: "Hãy yêu cầu một cách giải thích có thể kiểm tra cho từng khoản. Khi cơ sở tính và thời điểm thu rõ ràng, bạn sẽ lập ngân sách và đối chiếu chi phí dễ hơn.",
    relatedSlugs: ["cach-kiem-tra-tien-dien-nuoc-va-phi-dich-vu", "chon-phong-tro-theo-ngan-sach-va-vi-tri", "doc-hop-dong-thue-phong-tro"],
  },
  {
    slug: "nhan-biet-tin-dang-phong-tro-lua-dao",
    showRoomCta: true,
    title: "Các dấu hiệu nhận biết tin đăng phòng trọ lừa đảo",
    categorySlug: "an-toan", image: "/images/blog/RIPT_Rental_08.png", imageAlt: "Ảnh bìa Blue: Các dấu hiệu nhận biết tin đăng phòng trọ lừa đảo",
    excerpt: "Nhận ra dấu hiệu cần kiểm chứng và bảo vệ thông tin, tiền cọc khi tìm phòng trực tuyến.",
    keywords: ["lừa đảo", "tin đăng giả", "chuyển khoản", "xác minh chủ trọ"],
    introduction: "Không thể kết luận một tin đăng là gian lận chỉ từ một dấu hiệu riêng lẻ. Tuy vậy, những yêu cầu bất thường và thông tin không thể xác minh là lý do để dừng lại, kiểm tra thêm hoặc từ chối giao dịch. Bài viết tập trung vào cách giảm rủi ro, không đưa ra kết luận về cá nhân hay tin đăng cụ thể.",
    sections: [
      { heading: "Những dấu hiệu nên dừng lại để kiểm tra", paragraphs: ["Giá hoặc ưu đãi hấp dẫn khác thường nhưng người đăng không cung cấp địa chỉ cụ thể; ảnh có vẻ không cùng một căn; thông tin phòng thay đổi qua nhiều lần trao đổi; hoặc yêu cầu chuyển cọc trước khi xem đều cần được xác minh. Một người thúc ép “chuyển ngay kẻo mất” cũng không thay thế được việc kiểm tra.", "Cẩn trọng với tài khoản mới, thông tin liên hệ không thống nhất hoặc người nhận tiền khác tên nhưng không giải thích được vai trò. Không gửi mã xác thực, mật khẩu, ảnh hai mặt giấy tờ hoặc thông tin ngân hàng để “giữ lịch”. Nếu gặp yêu cầu lạ, ngắt trao đổi và kiểm chứng qua kênh độc lập."] },
      { heading: "Xác minh tin và người cho thuê", paragraphs: ["Tìm địa chỉ trên bản đồ, hỏi video trực tiếp có thể cho thấy căn phòng hiện tại và hẹn xem đúng địa chỉ. Hãy hỏi người trao đổi có phải chủ sở hữu, người quản lý hay bên môi giới và ai sẽ ký thỏa thuận. So sánh ảnh tin đăng với phòng thật, chú ý dấu hiệu ảnh được dùng cho nhiều nơi.", "Nếu họ đại diện cho chủ nhà, xin xác nhận quyền liên hệ hoặc giấy tờ phù hợp trước khi thanh toán. Không cần tự giữ bản sao dữ liệu nhạy cảm vượt quá mục đích. Khi thông tin chưa nhất quán, hãy xin thời gian kiểm tra; người cho thuê thiện chí thường có thể giải thích giao dịch rõ ràng."] },
      { heading: "Nếu đã gửi tiền hoặc thông tin", paragraphs: ["Lưu chứng từ, nội dung trao đổi, đường dẫn tin đăng, thời gian và thông tin giao dịch. Liên hệ ngân hàng hoặc đơn vị thanh toán sớm để hỏi quy trình xử lý phù hợp; không chuyển thêm tiền theo yêu cầu “mở khóa hoàn cọc”. Nếu thông tin cá nhân có thể bị lộ, thay đổi thông tin đăng nhập liên quan và liên hệ cơ quan chức năng khi cần.", "Trình bày sự việc theo dữ kiện mình có và tránh đăng công khai dữ liệu cá nhân, số tài khoản hoặc giấy tờ của người khác. Khi tìm hỗ trợ, dùng kênh chính thức và cảnh giác với người hứa chắc chắn thu hồi tiền để đổi lấy phí trả trước."] },
    ],
    checklist: ["Không cọc khi chưa xác minh người nhận và phòng.", "Không chia sẻ mật khẩu, OTP hoặc giấy tờ không cần thiết.", "Lưu chứng từ và liên hệ tổ chức có thẩm quyền nếu có sự cố."],
    conclusion: "Chậm lại để xác minh thường ít tốn kém hơn xử lý một giao dịch đáng ngờ. Nếu người đăng không thể làm rõ các thông tin cơ bản, bạn có thể chọn một lựa chọn khác.",
    relatedSlugs: ["nhung-dieu-can-biet-truoc-khi-dat-coc-thue-tro", "checklist-di-xem-phong-truc-tiep", "luu-y-an-ninh-va-phong-chay-khi-thue-tro"],
  },
  {
    slug: "cach-kiem-tra-tien-dien-nuoc-va-phi-dich-vu",
    aliases: ["theo-doi-tien-dien-nuoc-va-dich-vu-hang-thang"],
    title: "Cách kiểm tra tiền điện, nước và phí dịch vụ",
    categorySlug: "chi-phi", image: "/images/blog/RIPT_Rental_07.png", imageAlt: "Ảnh bìa Blue: Cách kiểm tra tiền điện, nước và phí dịch vụ",
    excerpt: "Dùng chỉ số, đơn giá và chứng từ để đối chiếu hóa đơn từng kỳ một cách bình tĩnh.",
    keywords: ["điện nước", "chỉ số đồng hồ", "hóa đơn", "dịch vụ"],
    introduction: "Khi hóa đơn có nhiều khoản, hãy kiểm tra từng dòng thay vì chỉ nhìn tổng số. Cách đối chiếu đơn giản nhất bắt đầu từ kỳ tính, chỉ số đầu và cuối, mức giá đã thống nhất cùng các phí cố định. Quy định và mức giá có thể khác theo nơi ở và thỏa thuận, nên hãy xác minh thông tin áp dụng cho phòng của bạn.",
    sections: [
      { heading: "Ghi lại chỉ số tại thời điểm nhận phòng", paragraphs: ["Khi nhận phòng, hỏi đồng hồ nào thuộc phòng và cách xác định số đầu kỳ. Ghi ngày, chỉ số và đơn vị; chụp ảnh rõ số hiển thị nếu người cho thuê đồng ý. Nếu đồng hồ ở khu vực chung hoặc không dễ đọc, đề nghị cùng xác nhận bằng tin nhắn hoặc biên bản bàn giao.", "Mỗi kỳ, lưu số cuối cùng và ngày chốt. Chênh lệch giữa số cuối và số đầu là lượng sử dụng trong kỳ nếu hai số đo cùng một đồng hồ và cùng đơn vị. Nếu thay đồng hồ, chuyển phòng hoặc có điều chỉnh, cần ghi cách quy đổi để không cộng trùng hay bỏ sót giai đoạn."] },
      { heading: "Đối chiếu đơn giá và cách tính", paragraphs: ["So sánh đơn giá với thỏa thuận thuê và kiểm tra hóa đơn ghi đúng kỳ, phòng, số lượng sử dụng. Nếu giá áp dụng theo mức bậc hoặc nhiều phần, yêu cầu bảng tính thể hiện từng phần thay vì chỉ gửi số tổng. Hỏi rõ có làm tròn hay điều chỉnh số liệu không.", "Các mức giá điện, nước, phí dịch vụ phụ thuộc điều kiện và quy định áp dụng tại thời điểm, địa điểm cụ thể. Đừng dựa vào một bài đăng cũ để khẳng định giá hiện hành. Khi cần xác minh, tra cứu nguồn chính thức có thẩm quyền và đối chiếu loại hình sử dụng cùng văn bản/thỏa thuận của nơi ở."] },
      { heading: "Xử lý khi số tiền khác dự kiến", paragraphs: ["Yêu cầu ảnh chỉ số hoặc bảng tính của kỳ đang hỏi; đối chiếu ngày chốt, đơn giá và số người nếu có phí tính theo người. Gửi câu hỏi ngắn, nêu dòng chưa rõ và con số đối chiếu để hai bên cùng kiểm tra. Giữ bản sao hóa đơn và phản hồi thay vì chỉ trao đổi qua cuộc gọi.", "Ví dụ minh họa: nếu số cuối kỳ tăng nhiều hơn thói quen, hãy kiểm tra thiết bị tiêu thụ điện mới, số ngày trong kỳ và việc ghi nhầm chữ số. Đây là hướng kiểm tra, không phải kết luận rằng đồng hồ hay hóa đơn sai. Nếu chưa thống nhất, ghi lại phần đang tranh luận và tìm hướng hỗ trợ phù hợp."] },
    ],
    checklist: ["Có ảnh chỉ số và ngày chốt.", "Đơn giá, đơn vị và kỳ tính khớp thỏa thuận.", "Mọi khoản dịch vụ có cách tính rõ."],
    conclusion: "Ghi chép đều đặn giúp phát hiện sai lệch sớm và làm cuộc trao đổi cụ thể hơn. Hãy xác minh mức giá qua nguồn phù hợp, vì bài viết này không thay thế bảng giá hoặc quy định đang áp dụng.",
    relatedSlugs: ["nhung-khoan-phi-can-hoi-ro-khi-thue-tro", "12-dieu-can-kiem-tra-truoc-khi-thue-phong-tro", "kinh-nghiem-o-ghep-chia-chi-phi-va-trach-nhiem"],
  },
  {
    slug: "luu-y-an-ninh-va-phong-chay-khi-thue-tro",
    title: "Lưu ý về an ninh và phòng cháy khi thuê trọ",
    categorySlug: "an-toan", image: "/images/blog/RIPT_Rental_09.png", imageAlt: "Ảnh bìa Blue: Lưu ý về an ninh và phòng cháy khi thuê trọ",
    excerpt: "Quan sát lối thoát, thiết bị điện và quy trình liên hệ khẩn cấp trước khi chuyển vào.",
    keywords: ["an ninh", "phòng cháy", "lối thoát", "khóa cửa"],
    introduction: "An toàn nơi ở cần được xem xét từ lúc đi xem phòng, không chỉ sau khi xảy ra sự cố. Hãy quan sát căn phòng và khu chung, hỏi người quản lý về quy trình liên lạc và tìm hướng dẫn chính thức phù hợp với loại nhà ở. Các gợi ý dưới đây mang tính thực hành, không thay thế quy chuẩn hoặc hướng dẫn của cơ quan chức năng.",
    sections: [
      { heading: "Kiểm tra lối ra và khu vực chung", paragraphs: ["Tìm lối ra, cầu thang, hành lang và cửa có thể mở được. Quan sát xem lối đi có bị xe, thùng đồ hoặc vật dụng chặn không. Hỏi cách mở cổng khi mất điện và ai có thể hỗ trợ ngoài giờ. Đừng cất vật dụng chắn lối thoát chỉ để tiết kiệm diện tích.", "Tìm hiểu vị trí bình chữa cháy hoặc thiết bị an toàn được trang bị, ngày kiểm tra nếu có thể xác nhận và người phụ trách hướng dẫn. Không tự ý di chuyển hay sử dụng thiết bị nếu chưa biết cách. Khi có nguy cơ khẩn cấp, ưu tiên rời khỏi nơi nguy hiểm và gọi số hỗ trợ chính thức."] },
      { heading: "Dùng điện và thiết bị có chủ ý", paragraphs: ["Kiểm tra dây điện hở, ổ cắm lỏng, dấu cháy sém hoặc thiết bị có tiếng/mùi bất thường. Không cắm quá nhiều thiết bị công suất cao vào một ổ chia. Tắt và rút thiết bị khi không dùng nếu phù hợp, đồng thời hỏi chủ trọ xử lý thiết bị cố định có dấu hiệu hỏng.", "Không tự sửa dây điện hoặc can thiệp hệ thống chung nếu bạn không có chuyên môn. Thông báo vị trí, dấu hiệu và thời gian phát hiện để người có trách nhiệm kiểm tra. Hạn chế để vật dễ cháy gần nguồn nhiệt và không che khuất thiết bị báo cháy nếu có."] },
      { heading: "Bảo vệ tài sản và thông tin cá nhân", paragraphs: ["Thử khóa cửa, cửa sổ và chốt; hỏi cách báo mất chìa hoặc thay khóa. Giữ giấy tờ, tiền và thiết bị có giá trị ở nơi an toàn. Khi chụp ảnh bàn giao, tránh để lộ giấy tờ hoặc thông tin riêng tư của người khác.", "Lưu số liên hệ chủ trọ, quản lý và người thân ở nơi dễ truy cập. Hỏi quy trình khi có người lạ cần vào phòng hoặc sửa chữa. Nếu có tình huống đe dọa, rời khỏi vị trí không an toàn và liên hệ cơ quan có thẩm quyền thay vì tự đối đầu."] },
    ],
    checklist: ["Biết lối ra và cách mở cổng.", "Giữ hành lang, cửa và lối đi luôn thông thoáng.", "Lưu liên hệ khẩn cấp và báo hỏng thiết bị sớm."],
    conclusion: "Một nơi ở an toàn bắt đầu từ thói quen quan sát, lối đi thông thoáng và thông tin liên lạc rõ. Hãy đối chiếu thêm hướng dẫn hiện hành của cơ quan chức năng tại địa phương.",
    relatedSlugs: ["nhan-biet-tin-dang-phong-tro-lua-dao", "12-dieu-can-kiem-tra-truoc-khi-thue-phong-tro", "chuyen-tro-tiet-kiem-thoi-gian-va-chi-phi"],
  },
  {
    slug: "chuyen-tro-tiet-kiem-thoi-gian-va-chi-phi",
    title: "Kinh nghiệm chuyển trọ tiết kiệm thời gian và chi phí",
    categorySlug: "chuyen-tro", image: "/images/blog/RIPT_Rental_13.png", imageAlt: "Ảnh bìa Blue: Kinh nghiệm chuyển trọ tiết kiệm thời gian và chi phí",
    excerpt: "Chia việc chuyển phòng thành các mốc chuẩn bị, đóng gói, bàn giao và cập nhật thông tin.",
    keywords: ["chuyển trọ", "đóng gói", "bàn giao", "tiền cọc"],
    introduction: "Chuyển trọ dễ tốn thêm tiền và thời gian nếu mọi việc dồn vào ngày cuối. Bắt đầu bằng việc xác nhận lịch bàn giao, những gì phải hoàn tất với nơi ở cũ và khả năng nhận phòng mới. Một kế hoạch theo mốc giúp bạn không quên hóa đơn, chìa khóa hoặc vật dụng cá nhân.",
    sections: [
      { heading: "Lập lịch và dự trù chi phí", paragraphs: ["Đọc lại thỏa thuận hiện tại để biết thời gian cần báo trước, ngày trả phòng và các khoản cần đối chiếu. Xác nhận bằng văn bản ngày bàn giao với chủ trọ cũ và ngày nhận phòng mới. Nếu hai lịch cách xa nhau, tính phương án lưu đồ hoặc ở tạm.", "Dự trù xe, nhân công, vật liệu đóng gói, vệ sinh và các khoản phát sinh đã biết. Hỏi báo giá theo khối lượng, tầng, quãng đường, thời gian chờ và phí tháo lắp. Đây là khoản cần kiểm tra theo nhà cung cấp; không có một mức giá chung áp dụng cho mọi cuộc chuyển trọ."] },
      { heading: "Phân loại, đóng gói và bảo vệ đồ", paragraphs: ["Chia đồ thành nhóm giữ lại, tặng/bỏ và cần vận chuyển. Đóng vật nặng vào thùng nhỏ, ghi tên phòng hoặc nhóm đồ bên ngoài. Bọc riêng đồ dễ vỡ, giữ giấy tờ và vật cần dùng trong ngày đầu ở một túi dễ lấy.", "Chụp ảnh thiết bị trước khi tháo, giữ phụ kiện cùng món đồ và kiểm tra phương tiện có phù hợp kích thước hay không. Không đóng chung hóa chất, thực phẩm dễ hỏng hoặc vật sắc nhọn với đồ mềm. Nếu thuê dịch vụ, xác nhận những món được bảo hiểm hoặc điều kiện xử lý hư hỏng trước khi giao đồ."] },
      { heading: "Bàn giao nơi cũ và nhận nơi mới", paragraphs: ["Ghi chỉ số điện nước, chụp hiện trạng, thu gom chìa khóa và rà lại tài sản bàn giao. Đối chiếu hóa đơn, tiền cọc và các khoản đã thanh toán. Nếu có khấu trừ hoặc sửa chữa, yêu cầu ghi rõ nội dung và chứng từ liên quan theo thỏa thuận.", "Ở phòng mới, kiểm tra khóa, nước, điện và tình trạng đồ trước khi bày hết hành lý. Ghi lại chỉ số đầu kỳ, lỗi có sẵn và danh sách chìa khóa. Lưu biên bản, ảnh và trao đổi liên quan cho đến khi các khoản cuối cùng được xác nhận."] },
    ],
    checklist: ["Xác nhận ngày trả và ngày nhận bằng văn bản.", "Ghi chỉ số, hiện trạng và số lượng chìa khóa.", "Để giấy tờ, thuốc và vật thiết yếu trong túi riêng."],
    conclusion: "Một kế hoạch ngắn cùng hồ sơ bàn giao đầy đủ giúp giảm việc phải quay lại và dễ đối chiếu tiền cọc. Hãy giữ lịch thực tế, có khoảng dự phòng cho vận chuyển và vệ sinh.",
    relatedSlugs: ["ban-giao-phong-va-doi-chieu-tien-coc", "nhung-dieu-nguoi-thue-can-biet-ve-quyen-va-thu-tuc-cu-tru", "luu-y-an-ninh-va-phong-chay-khi-thue-tro"],
  },
  {
    slug: "chong-nong-chong-am-va-giu-phong-thong-thoang",
    title: "Cách chống nóng, chống ẩm và giữ phòng trọ thông thoáng",
    categorySlug: "cuoc-song", image: "/images/blog/RIPT_Rental_10.png", imageAlt: "Ảnh bìa Blue: Cách chống nóng, chống ẩm và giữ phòng trọ thông thoáng",
    excerpt: "Ưu tiên thông gió, che nắng phù hợp và xử lý nguồn ẩm trước khi mua thêm thiết bị.",
    keywords: ["chống nóng", "chống ẩm", "thông gió", "nồm"],
    introduction: "Cảm giác nóng và ẩm có thể đến từ nhiều nguyên nhân: nắng chiếu trực tiếp, phòng kín, thấm nước hoặc thói quen phơi đồ trong nhà. Hãy tìm nguồn gây khó chịu trước, sau đó thử giải pháp ít tốn kém và phù hợp với cấu trúc phòng. Không che kín cửa thông gió hoặc thay đổi kết cấu khi chưa được đồng ý.",
    sections: [
      { heading: "Tạo luồng không khí an toàn", paragraphs: ["Mở cửa sổ và cửa phòng vào thời điểm không khí bên ngoài phù hợp, dùng quạt để hỗ trợ luân chuyển thay vì chỉ thổi vào một góc. Nếu phòng chỉ có một cửa, chọn thời điểm thông gió và giữ lối đi gọn. Dùng lưới chắn côn trùng nếu có thể lắp mà không làm hỏng khung.", "Tránh để đồ lớn che hoàn toàn cửa gió hoặc kê sát tường ẩm. Khi sử dụng quạt hút nhà vệ sinh, kiểm tra đường thoát và vệ sinh lưới theo hướng dẫn. Nếu phòng có mùi kéo dài hoặc không khí bí dù đã thông gió, báo người quản lý để kiểm tra nguyên nhân."] },
      { heading: "Giảm nắng và kiểm soát độ ẩm", paragraphs: ["Rèm sáng màu, tấm che nắng phù hợp hoặc sắp xếp bàn làm việc tránh vùng nắng gắt có thể giúp phòng dễ chịu hơn. Chọn giải pháp không cản lối thoát và hỏi trước khi dán, khoan hoặc gắn vật vào mặt ngoài. Tắt thiết bị khi không cần để hạn chế nhiệt và điện năng tiêu thụ.", "Lau khô khu vực đọng nước, phơi đồ ở nơi thoáng và cách tường một khoảng nhỏ. Hộp hút ẩm hoặc máy hút ẩm có thể hữu ích tùy diện tích và độ ẩm, nhưng cần đọc hướng dẫn, vệ sinh và đổ nước đúng cách. Nếu xuất hiện vết thấm hoặc mốc lan rộng, báo sớm để xử lý nguồn nước thay vì chỉ che bằng sơn."] },
      { heading: "Sắp xếp gọn để phòng dễ vệ sinh", paragraphs: ["Giảm đồ ít dùng, đặt vật dụng cách sàn và tạo khoảng lưu thông quanh giường, tủ. Dùng hộp có nắp cho đồ vải và giữ khu vực bếp khô sạch. Cây trồng trong nhà không thay thế việc thông gió và cần phù hợp ánh sáng, tránh tưới quá nhiều gây ẩm thêm.", "Theo dõi thời điểm phòng nóng hoặc ẩm nhất để nhận ra quy luật. Ghi lại ngày mưa, vị trí đọng nước và thiết bị đang dùng nếu cần trao đổi với chủ trọ. Cách ghi đơn giản giúp việc tìm nguyên nhân rõ hơn so với chỉ nhận xét chung là phòng “bí”."] },
    ],
    checklist: ["Không che cửa gió hoặc lối thoát.", "Xử lý nguồn thấm, không chỉ che vết mốc.", "Thử biện pháp ít tốn kém trước khi mua thiết bị."],
    conclusion: "Phòng dễ chịu thường cần kết hợp thông gió, giảm nguồn nhiệt và kiểm soát ẩm. Nếu vấn đề đến từ kết cấu hoặc rò rỉ, hãy báo người phụ trách để xử lý gốc.",
    relatedSlugs: ["trang-tri-phong-tro-nho-dep-va-tiet-kiem", "kinh-nghiem-o-ghep-chia-chi-phi-va-trach-nhiem", "cach-kiem-tra-tien-dien-nuoc-va-phi-dich-vu"],
  },
  {
    slug: "trang-tri-phong-tro-nho-dep-va-tiet-kiem",
    title: "Mẹo trang trí phòng trọ nhỏ đẹp và tiết kiệm",
    categorySlug: "cuoc-song", image: "/images/blog/RIPT_Rental_11.png", imageAlt: "Ảnh bìa Blue: Mẹo trang trí phòng trọ nhỏ đẹp và tiết kiệm",
    excerpt: "Tận dụng chiều cao, chọn đồ đa năng và giữ lối đi để căn phòng nhỏ dễ sử dụng hơn.",
    keywords: ["trang trí", "phòng nhỏ", "nội thất", "tiết kiệm"],
    introduction: "Phòng nhỏ không cần nhiều đồ mới để trở nên dễ chịu. Bắt đầu bằng cách xác định việc nào cần diễn ra trong phòng: ngủ, học, nấu đơn giản hay làm việc. Sau đó bố trí lối đi và vùng sử dụng trước, chọn vật dụng vừa kích thước và tránh giải pháp làm hỏng tường hoặc ảnh hưởng an toàn.",
    sections: [
      { heading: "Đo phòng và chia vùng sử dụng", paragraphs: ["Đo chiều rộng, chiều dài, vị trí cửa, ổ cắm và phần tường có thể kê đồ. Vẽ sơ đồ đơn giản trên giấy hoặc điện thoại rồi thử bố trí giường, bàn, tủ và lối mở cửa. Chừa đường đi liên tục để không phải dịch đồ mỗi khi ra vào.", "Chọn một món có nhiều công năng như bàn gấp hoặc hộp chứa đồ dưới giường nếu phù hợp thói quen. Đo cả kích thước lúc mở ra, không chỉ khi gấp. Tránh mua theo ảnh quảng cáo trước khi biết món đó có thể đưa qua cửa và đặt vừa trong phòng hay không."] },
      { heading: "Tận dụng chiều cao và ánh sáng", paragraphs: ["Kệ đứng giúp giải phóng mặt sàn nhưng cần chắc chắn, đúng tải trọng và được đặt an toàn. Nếu phải khoan tường hoặc gắn vật nặng, hỏi chủ trọ trước. Có thể dùng móc tháo được cho đồ nhẹ theo hướng dẫn của nhà sản xuất, nhưng không treo vật nguy hiểm phía trên giường.", "Rèm sáng, đèn bàn phù hợp và bề mặt gọn giúp phòng đỡ nặng nề. Dùng vài màu chủ đạo thay vì mua nhiều món trang trí rời rạc. Giữ cửa sổ và nguồn sáng không bị chắn để tận dụng ánh sáng tự nhiên khi có thể."] },
      { heading: "Trang trí với ngân sách có giới hạn", paragraphs: ["Ưu tiên món cải thiện việc sử dụng hằng ngày trước vật trang trí: đèn đủ sáng, móc treo, thùng rác có nắp, rèm che nắng hoặc hộp phân loại. Có thể tận dụng đồ sẵn có, làm sạch và đổi vị trí trước khi mua thêm.", "Đặt ngân sách riêng cho đồ trang trí và dừng lại khi đã đủ công năng. Trước khi sơn, dán giấy lớn hoặc thay đổi thiết bị, xin phép và thỏa thuận cách hoàn trả phòng. Chụp ảnh hiện trạng ban đầu và giữ hóa đơn của vật dụng cần mang đi khi chuyển trọ."] },
    ],
    checklist: ["Đo phòng và lối vận chuyển đồ.", "Giữ lối đi, cửa sổ và thiết bị an toàn thông thoáng.", "Hỏi trước khi khoan, sơn hoặc thay đổi cấu trúc."],
    conclusion: "Một căn phòng gọn gàng đến từ cách chọn và sắp xếp phù hợp, không phải số lượng đồ trang trí. Hãy thử bố trí bằng những vật mình đã có trước khi chi thêm.",
    relatedSlugs: ["chong-nong-chong-am-va-giu-phong-thong-thoang", "kinh-nghiem-o-ghep-chia-chi-phi-va-trach-nhiem", "12-dieu-can-kiem-tra-truoc-khi-thue-phong-tro"],
  },
  {
    slug: "kinh-nghiem-o-ghep-chia-chi-phi-va-trach-nhiem",
    title: "Kinh nghiệm ở ghép: phân chia chi phí và trách nhiệm",
    categorySlug: "cuoc-song", image: "/images/blog/RIPT_Rental_12.png", imageAlt: "Ảnh bìa Blue: Kinh nghiệm ở ghép, phân chia chi phí và trách nhiệm",
    excerpt: "Thống nhất cách chia tiền, việc chung, khách đến chơi và xử lý khi một người chuyển đi.",
    keywords: ["ở ghép", "chia tiền", "bạn cùng phòng", "trách nhiệm"],
    introduction: "Ở ghép có thể giảm một phần chi phí và tạo cảm giác có người chia sẻ, nhưng sinh hoạt chung cần được thống nhất từ đầu. Một thỏa thuận đơn giản giữa những người ở cùng giúp tránh hiểu lầm về khoản tiền, việc nhà và quyền riêng tư.",
    sections: [
      { heading: "Chọn cách chia phù hợp từng khoản", paragraphs: ["Tiền thuê có thể được chia đều hoặc theo diện tích, số người hay thỏa thuận khác. Điện nước và dịch vụ cũng có thể khác nhau tùy cách sử dụng. Thống nhất công thức cho từng khoản thay vì một câu chung “chia đều tất cả”, nhất là khi có người thường xuyên vắng mặt hoặc dùng không gian riêng.", "Dùng bảng theo dõi gồm kỳ, tổng số, phần mỗi người và người đã thanh toán. Đặt ngày gửi chứng từ và thời hạn hoàn lại rõ ràng. Với tiền chung để mua đồ dùng, thống nhất khoản nào cần hỏi cả nhóm trước và cách xử lý khi còn dư."] },
      { heading: "Thống nhất việc nhà và quyền riêng tư", paragraphs: ["Lập lịch dọn khu chung theo tuần hoặc phân công theo khu vực. Ghi rõ mức tối thiểu cần làm như đổ rác, vệ sinh bếp và giữ lối đi. Lịch nên thực tế với thời gian của mọi người và có cách đổi ca khi bận.", "Thống nhất trước về khách qua đêm, giờ yên tĩnh, mượn đồ, thú cưng và việc sử dụng khu vực riêng. Trao đổi bằng lời lẽ cụ thể, không dùng quy tắc mơ hồ như “phải ý tứ”. Mỗi người vẫn cần không gian riêng và quyền từ chối việc chia sẻ đồ cá nhân."] },
      { heading: "Xử lý bất đồng và thay đổi người ở", paragraphs: ["Khi có vấn đề, nêu việc cụ thể, thời điểm và ảnh hưởng thay vì gán ý định cho nhau. Cùng xem lại thỏa thuận và đề xuất thời hạn sửa đổi. Nếu liên quan tới chủ trọ, thông tin cho họ theo đúng vai trò và hợp đồng đang áp dụng.", "Trước khi một người chuyển đi, rà lại người đứng tên thuê, tiền cọc, đồ chung, hóa đơn còn thiếu và thời điểm bàn giao. Không tự tìm người thay thế hoặc để người khác chuyển vào nếu thỏa thuận yêu cầu báo trước hay được đồng ý. Ghi lại phần tiền và tài sản được hai bên xác nhận."] },
    ],
    checklist: ["Viết công thức chia tiền và ngày thanh toán.", "Lập quy ước khu chung, khách và quyền riêng tư.", "Ghi rõ việc xử lý tiền cọc khi người ở thay đổi."],
    conclusion: "Ở ghép bền vững cần sự rõ ràng và khả năng trao đổi tôn trọng nhau. Hãy thống nhất những việc có thể kiểm tra được và cập nhật khi hoàn cảnh thay đổi.",
    relatedSlugs: ["nhung-khoan-phi-can-hoi-ro-khi-thue-tro", "cach-kiem-tra-tien-dien-nuoc-va-phi-dich-vu", "trang-tri-phong-tro-nho-dep-va-tiet-kiem"],
  },
  {
    slug: "nhung-dieu-nguoi-thue-can-biet-ve-quyen-va-thu-tuc-cu-tru",
    title: "Những điều người thuê cần biết về quyền, nghĩa vụ và thủ tục cư trú",
    categorySlug: "chuyen-tro", image: "/images/blog/RIPT_Rental_14.png", imageAlt: "Ảnh bìa Blue: Quyền, nghĩa vụ và thủ tục cư trú người thuê cần biết",
    excerpt: "Lưu thỏa thuận, trao đổi với chủ nhà và kiểm tra thủ tục cư trú qua kênh chính thức.",
    keywords: ["quyền người thuê", "nghĩa vụ", "tạm trú", "cư trú", "thủ tục"],
    introduction: "Quyền và nghĩa vụ của người thuê phụ thuộc vào thỏa thuận, loại hình thuê và quy định hiện hành. Thủ tục cư trú cũng có thể thay đổi theo thời điểm và cách nộp hồ sơ. Bài viết này hướng dẫn cách chuẩn bị và kiểm tra nguồn chính thức, không khẳng định một quy trình pháp lý cố định cho mọi trường hợp.",
    sections: [
      { heading: "Giữ hồ sơ thuê và trao đổi có thể đối chiếu", paragraphs: ["Lưu hợp đồng hoặc thỏa thuận, biên nhận cọc, xác nhận thanh toán, hiện trạng bàn giao và các phụ lục. Ghi lại đầu mối liên hệ khi có hỏng hóc hoặc vấn đề sinh hoạt. Khi phát sinh thay đổi giá, thời hạn hoặc người ở, yêu cầu xác nhận bằng văn bản để hai bên cùng có bản lưu.", "Đọc kỹ điều khoản về sử dụng phòng, thanh toán, sửa chữa, thông báo và kết thúc thuê. Nếu chưa rõ một nghĩa vụ, hỏi người cho thuê trước khi đồng ý. Với bất đồng đáng kể, lưu chứng cứ và tìm hỗ trợ pháp lý hoặc cơ quan có thẩm quyền thay vì dựa vào lời khuyên không rõ nguồn."] },
      { heading: "Kiểm tra thủ tục cư trú qua nguồn chính thức", paragraphs: ["Khi cần khai báo hoặc đăng ký thông tin cư trú, tra cứu hướng dẫn mới nhất trên cổng dịch vụ công hoặc hỏi cơ quan công an địa phương có thẩm quyền. Yêu cầu cụ thể có thể phụ thuộc tình trạng của người ở, loại giấy tờ và phương thức nộp hồ sơ; đừng dùng bài viết cũ làm căn cứ duy nhất.", "Hỏi chủ nhà cách phối hợp cung cấp thông tin nơi ở và giấy tờ liên quan. Chỉ gửi dữ liệu qua kênh chính thức, kiểm tra địa chỉ trang và mục đích thu thập. Không đưa mã OTP, mật khẩu hoặc bản chụp giấy tờ cho người tự xưng hỗ trợ làm thủ tục nhưng không thể xác minh."] },
      { heading: "Bảo vệ dữ liệu cá nhân và theo dõi hồ sơ", paragraphs: ["Trước khi cung cấp giấy tờ, hỏi ai nhận, dùng vào việc gì, lưu trong bao lâu và cách liên hệ nếu muốn chỉnh sửa. Dùng bản sao có ghi mục đích khi phù hợp và tránh chia sẻ thông tin không cần thiết trong nhóm đông người.", "Nếu nộp hồ sơ trực tuyến, lưu mã tiếp nhận hoặc giấy hẹn và kiểm tra tình trạng qua cổng chính thức. Nếu hướng dẫn chưa rõ, gọi cơ quan tiếp nhận bằng số liên hệ công khai trên trang chính thức. Ghi ngày, nơi nhận và nội dung đã được xác nhận để thuận tiện bổ sung khi cần."] },
    ],
    checklist: ["Lưu hợp đồng, biên nhận và các thay đổi.", "Tra cứu thủ tục cư trú tại kênh chính thức hiện hành.", "Chỉ cung cấp dữ liệu cá nhân cần thiết qua kênh xác minh."],
    conclusion: "Giữ hồ sơ thuê minh bạch và xác minh thủ tục từ nguồn chính thức giúp bạn chủ động hơn. Nếu tình huống có tranh chấp hoặc nghĩa vụ pháp lý cụ thể, hãy hỏi cơ quan có thẩm quyền hoặc người tư vấn phù hợp.",
    relatedSlugs: ["chuyen-tro-tiet-kiem-thoi-gian-va-chi-phi", "doc-hop-dong-thue-phong-tro", "ban-giao-phong-va-doi-chieu-tien-coc"],
  },
  {
    slug: "ban-giao-phong-va-doi-chieu-tien-coc",
    aliases: ["luu-y-khi-ban-giao-hoac-tra-phong-tro"],
    title: "Bàn giao phòng và đối chiếu tiền cọc khi chuyển đi",
    categorySlug: "chuyen-tro", image: "/images/blog/RIPT_Rental_15.png", imageAlt: "Ảnh bìa Blue: Bàn giao phòng và đối chiếu tiền cọc khi chuyển đi",
    excerpt: "Chốt hiện trạng, chỉ số, chìa khóa và các khoản cuối kỳ bằng biên bản có thể lưu lại.",
    keywords: ["bàn giao", "trả phòng", "tiền cọc", "chuyển đi"],
    introduction: "Ngày trả phòng thường có nhiều việc xảy ra cùng lúc. Chuẩn bị trước danh sách tài sản, hóa đơn và lịch hẹn sẽ giúp bạn đối chiếu rõ hiện trạng, chìa khóa và tiền cọc. Cách xử lý cụ thể cần theo thỏa thuận thuê và xác nhận của các bên.",
    sections: [
      { heading: "Chuẩn bị trước ngày bàn giao", paragraphs: ["Thông báo thời gian chuyển đi theo thỏa thuận, xác nhận ngày kiểm tra phòng và hỏi cần dọn dẹp hoặc hoàn trả vật dụng nào. Rà lại đồ được ghi trong biên bản nhận phòng và tìm hóa đơn chưa thanh toán. Thu dọn vật dụng cá nhân để hai bên có thể kiểm tra đầy đủ.", "Chụp lại tình trạng phòng, thiết bị, tường và sàn trước khi sửa chữa hoặc vệ sinh. Phân biệt hao mòn thông thường với hư hỏng đã có từ trước bằng ảnh và ghi chú lúc nhận. Nếu cần sửa, trao đổi trước về phạm vi và người thực hiện để tránh tự ý làm thay đổi hiện trạng."] },
      { heading: "Đối chiếu chỉ số và tài sản", paragraphs: ["Cùng ghi số điện nước cuối kỳ, ngày chốt và đơn vị tính. So sánh với số đầu hoặc kỳ gần nhất theo cách hai bên đã thống nhất. Nếu có đồng hồ dùng chung hoặc số liệu chưa rõ, ghi phần cần xác minh riêng thay vì gộp vào khoản đã xác nhận.", "Kiểm đếm chìa khóa, thẻ ra vào, thiết bị và đồ được giao. Lập danh sách món thiếu hoặc hư hỏng có ghi chú, ảnh nếu cần. Đọc lại từng mục trước khi ký biên bản và giữ một bản giống nhau cho mỗi bên."] },
      { heading: "Xác nhận khoản cọc và kết thúc thuê", paragraphs: ["Đối chiếu tiền thuê, phí còn lại, khoản đã thanh toán và điều kiện hoàn cọc trong thỏa thuận. Nếu có khoản dự kiến khấu trừ, yêu cầu nêu rõ lý do, số tiền và căn cứ để có thể kiểm tra. Thống nhất ngày, phương thức hoàn tiền và chứng từ xác nhận.", "Không ký xác nhận rằng mọi khoản đã giải quyết xong nếu vẫn còn số liệu đang chờ. Có thể ghi rõ mục nào đã thống nhất và mục nào cần đối chiếu tiếp, cùng thời điểm hai bên sẽ phản hồi. Lưu biên bản, ảnh, chứng từ hoàn tiền và trao đổi đến khi hoàn tất."] },
    ],
    checklist: ["Chốt lịch và rà điều kiện trả phòng.", "Ghi chỉ số, thiết bị và chìa khóa.", "Ghi riêng khoản đã thống nhất và khoản còn chờ."],
    conclusion: "Bàn giao rõ ràng không đòi hỏi thủ tục phức tạp: cần hồ sơ, ảnh và xác nhận cho từng nội dung. Đối chiếu theo thỏa thuận giúp hai bên tránh tranh luận dựa trên trí nhớ.",
    relatedSlugs: ["chuyen-tro-tiet-kiem-thoi-gian-va-chi-phi", "nhung-dieu-nguoi-thue-can-biet-ve-quyen-va-thu-tuc-cu-tru", "nhung-dieu-can-biet-truoc-khi-dat-coc-thue-tro"],
  },
];

for (const post of blogPosts) post.category = categoryLabel[post.categorySlug];

export const getBlogReadingMinutes = (post) => {
  const body = [post.title, post.excerpt, post.introduction, ...post.sections.flatMap((section) => [section.heading, ...section.paragraphs, ...(section.bullets || [])]), ...(post.checklist || []), post.conclusion].join(" ");
  const words = body.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 220));
};

export const getValidBlogDate = (value) => {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return 0;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day ? date.getTime() : 0;
};

export const getBlogPostBySlug = (slug) => blogPosts.find((post) => post.slug === slug || post.aliases?.includes(slug));

export const filterBlogPosts = (posts, { query = "", categorySlug = "all", sortBy = "curated" } = {}) => {
  const normalizedQuery = normalizeBlogText(query.trim());
  const filtered = posts.filter((post) => {
    const matchesCategory = categorySlug === "all" || post.categorySlug === categorySlug;
    const searchable = normalizeBlogText([
      post.title, post.category, post.excerpt, post.introduction, ...(post.keywords || []),
      ...post.sections.flatMap((section) => [section.heading, ...section.paragraphs, ...(section.bullets || [])]),
      ...(post.checklist || []), post.conclusion,
    ].join(" "));
    return matchesCategory && (!normalizedQuery || searchable.includes(normalizedQuery));
  });
  if (sortBy === "newest") filtered.sort((a, b) => getValidBlogDate(b.publishedAt) - getValidBlogDate(a.publishedAt));
  return filtered;
};

export const normalizeBlogText = (value = "") =>
  String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/gi, "d")
    .toLocaleLowerCase("vi-VN");
