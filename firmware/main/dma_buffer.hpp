#pragma once

#include "esp_heap_caps.h"

#include <vector>

template<class T>
struct DmaAllocator {
  using value_type = T;
  DmaAllocator() noexcept = default;

  template<class U>
  DmaAllocator(const DmaAllocator<U>&) noexcept {};

  T* allocate(std::size_t n) {
    printf("allocate %u\n", n * sizeof(T));
    return reinterpret_cast<T*>(heap_caps_malloc(n * sizeof(T), MALLOC_CAP_DMA));
  }

  void deallocate(T* p, std::size_t n) {
    heap_caps_free(p);
  }
};

template<class T, class U>
constexpr bool operator==(const DmaAllocator<T>&, const DmaAllocator<U>&) noexcept {
  return false;
}

template<class T, class U>
constexpr bool operator!=(const DmaAllocator<T>&, const DmaAllocator<U>&) noexcept {
  return true;
}

using DmaBuffer = std::vector<uint8_t, DmaAllocator<uint8_t>>;

static DmaBuffer make_dma_buffer(std::size_t size) {
  DmaBuffer buffer{};
  buffer.resize(size);

  return buffer;
}
