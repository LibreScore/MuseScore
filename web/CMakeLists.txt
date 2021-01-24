
include (${PROJECT_SOURCE_DIR}/build/gch.cmake)

include_directories(
      ${PROJECT_SOURCE_DIR}
      ${CMAKE_CURRENT_BINARY_DIR}
      )

if (NOT MSVC)
   set(_all_h_file "${PROJECT_BINARY_DIR}/all.h")
else (NOT MSVC)
   set(_all_h_file "${PROJECT_SOURCE_DIR}/all.h")
endif (NOT MSVC)

